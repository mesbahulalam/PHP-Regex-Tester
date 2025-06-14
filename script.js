// Utility: escape regex for JS
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main logic
const regexInput = document.getElementById('regex');
const replacementInput = document.getElementById('replacement');
const testStringsInput = document.getElementById('testStrings');
const resultsDiv = document.getElementById('results');
const tabs = document.querySelectorAll('.tab');
const phpCodePre = document.getElementById('php-code');
const copyPhpCodeBtn = document.getElementById('copy-php-code');

let currentFunc = 'preg_match';

function parseRegex(str) {
    // Accepts /pattern/flags or just pattern
    const match = str.match(/^\/(.*)\/(\w*)$/);
    if (match) {
        return { pattern: match[1], flags: match[2] };
    }
    return { pattern: str, flags: '' };
}

function escapePhpString(str) {
    // Escape backslashes and single quotes for PHP single-quoted strings
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getPhpCode() {
    const regexRaw = regexInput.value.trim();
    const replacement = replacementInput.value;
    const { pattern, flags } = parseRegex(regexRaw);

    let phpPattern = pattern.replace(/'/g, "\\'");
    let phpFlags = flags;
    let delimiter = '/';
    // If pattern contains delimiter, pick another (rare, but possible)
    if (phpPattern.includes('/')) {
        delimiter = '#';
        phpPattern = phpPattern.replace(/#/g, '\\#');
    }
    let phpRegex = delimiter + phpPattern + delimiter + phpFlags;

    let code = '';
    switch (currentFunc) {
        case 'preg_match':
            code = `preg_match('${phpRegex}', $subject, $matches);`;
            break;
        case 'preg_match_all':
            code = `preg_match_all('${phpRegex}', $subject, $matches);`;
            break;
        case 'preg_replace':
            code = `$result = preg_replace('${phpRegex}', '${escapePhpString(replacement)}', $subject);`;
            break;
        case 'preg_grep':
            code = `$results = preg_grep('${phpRegex}', $arrayOfStrings);`;
            break;
        case 'preg_split':
            code = `$result = preg_split('${phpRegex}', $subject);`;
            break;
    }
    return code;
}

function updatePhpCode() {
    phpCodePre.textContent = getPhpCode();
}

function showResult() {
    const regexRaw = regexInput.value.trim();
    const replacement = replacementInput.value;
    const testStrings = testStringsInput.value.split(/\r?\n/);
    const { pattern, flags } = parseRegex(regexRaw);
    let regex;
    try {
        regex = new RegExp(pattern, flags);
    } catch (e) {
        resultsDiv.textContent = 'Invalid regex: ' + e.message;
        return;
    }
    let output = '';
    switch (currentFunc) {
        case 'preg_match':
            output = testStrings.map(line => {
                const m = regex.exec(line);
                if (!m) return `${line}\n  => no match`;
                let arr = m.map((v, i) => `${i} => ${v}`).join('\n  ');
                return `${line}\n  array(${m.length})\n  ${arr}`;
            }).join('\n\n');
            break;
        case 'preg_match_all':
            // Ensure global flag is present
            let allFlags = flags.includes('g') ? flags : flags + 'g';
            let regexAll;
            try {
                regexAll = new RegExp(pattern, allFlags);
            } catch (e) {
                resultsDiv.textContent = 'Invalid regex: ' + e.message;
                return;
            }
            output = testStrings.map(line => {
                let m = [...line.matchAll(regexAll)];
                if (!m.length) return `${line}\n  => no match`;
                let arr = m.map((match, idx) =>
                    `Match ${idx}:\n    ` + match.map((v, i) => `${i} => ${v}`).join('\n    ')
                ).join('\n  ');
                return `${line}\n  array(${m.length})\n  ${arr}`;
            }).join('\n\n');
            break;
        case 'preg_replace':
            output = testStrings.map(line => {
                let replaced = line.replace(regex, replacement);
                return `${line}  =>  ${replaced}`;
            }).join('\n');
            break;
        case 'preg_grep':
            let matches = testStrings.filter(line => regex.test(line));
            output = matches.length ? matches.join('\n') : 'No matches.';
            break;
        case 'preg_split':
            output = testStrings.map(line => {
                let arr = line.split(regex);
                return `${line}\n  array(${arr.length})\n  ` + arr.map((v, i) => `${i} => ${v}`).join('\n  ');
            }).join('\n\n');
            break;
    }
    resultsDiv.textContent = output;
    updatePhpCode();
}

regexInput.addEventListener('input', showResult);
replacementInput.addEventListener('input', showResult);
testStringsInput.addEventListener('input', showResult);
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFunc = tab.dataset.func;
        showResult();
    });
});
copyPhpCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(phpCodePre.textContent);
});

// Set defaults
regexInput.value = '/(.*), (.*)/';
replacementInput.value = '$0 --> $2 $1';
testStringsInput.value = `last_name, first_name\nbjorge, philip\nkardashian, kim\nmercury, freddie`;
showResult();
