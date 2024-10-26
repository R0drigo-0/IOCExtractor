const iocPatterns = {
  ipv4: /(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\/\d{1,2})?/g,
  ipv6: /\b([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}(\/[0-9]{1,3})?\b/g,
  macAddress: /(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g,
  url: /https?:\/\/(?:www\.|[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z]{2,6})(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
  filePath:
    /(?:[a-zA-Z]:\\(?:[^<>:"/\\|?*\x00-\x1F]+\\)*[^<>:"/\\|?*\x00-\x1F]*)|(?:\/(?:[^<>:"/\\|?*\x00-\x1F]+\/)*[^<>:"/\\|?*\x00-\x1F]*)/g,
  asn: /\bAS\d+\b/g,
  sha1: /\b[A-Fa-f0-9]{40}\b/g,
  sha256: /\b[A-Fa-f0-9]{64}\b/g,
  sha512: /\b[A-Fa-f0-9]{128}\b/g,
  md5: /\b[A-Fa-f0-9]{32}\b/g,
  cve: /\bCVE-\d{4}-\d{1,7}\b/g,
  mitre: /\bT\d{4}\b/g,
  clamav: /\b[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+-[0-9]+-[0-9]+\b/g,
};

const extractYaraRules = (text) => {
  const yaraPattern = /rule\s+[A-Za-z0-9._]+\s*:\s*[A-Za-z0-9._]+\s*{/g;
  const matches = text.match(yaraPattern) || [];
  const validYaraRules = [];

  for (const match of matches) {
    const startIndex = text.indexOf(match);
    let openBraces = 1;
    let endIndex = startIndex + match.length;

    while (openBraces > 0 && endIndex < text.length) {
      const char = text[endIndex];

      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;

      endIndex++;
    }

    if (openBraces === 0) {
      validYaraRules.push(text.slice(startIndex, endIndex));
    }
  }

  return validYaraRules;
};

const extractSnortRules = (text) => {
  const snortPattern =
    /alert\s+(tcp|udp|icmp|ip)\s+(any|[a-zA-Z0-9_.$]+)\s+(any|[a-zA-Z0-9_.$]+)\s*->\s+(any|[a-zA-Z0-9_.$]+)\s+(any|[a-zA-Z0-9_.$]+)\s*\(([^()]*;?)+\)/g;
  const matches = text.match(snortPattern) || [];
  const validSnortRules = [];

  for (const match of matches) {
    const startIndex = text.indexOf(match);
    let openBraces = 1;
    let endIndex = startIndex + match.length;

    while (openBraces > 0 && endIndex < text.length) {
      const char = text[endIndex];

      if (char === "(") openBraces++;
      else if (char === ")") openBraces--;

      endIndex++;
    }

    if (openBraces === 0) {
      validSnortRules.push(text.slice(startIndex, endIndex));
    }
  }

  return validSnortRules;
};

const extractIOCs = (text) => {
  const results = {};
  for (const [type, pattern] of Object.entries(iocPatterns)) {
    results[type] = [...new Set(text.match(pattern) || [])];
  }

  results["yara"] = extractYaraRules(text);
  results["snort"] = extractSnortRules(text);

  return results;
};

export { extractIOCs };
