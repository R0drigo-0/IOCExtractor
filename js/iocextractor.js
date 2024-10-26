const iocPatterns = {
  ipv4: /(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\/\d{1,2})?/g,
  ipv6: /\b([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}(\/[0-9]{1,3})?\b/g,
  macAddress: /(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g,
  url: /https?:\/\/(?:www\.|[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z]{2,6})(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
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
      if (text[endIndex] === "{") openBraces++;
      else if (text[endIndex] === "}") openBraces--;
      endIndex++;
    }

    if (openBraces === 0) {
      validYaraRules.push(text.slice(startIndex, endIndex));
    }
  }

  return validYaraRules;
};

const extractSnortRules = (text) => {
  const snortPattern = /(?:alert|reject)\s+(tcp|udp|icmp|ip)\s+(any|[a-zA-Z0-9_.$]+)\s+(any|[a-zA-Z0-9_.$]+)\s*->\s+(any|[a-zA-Z0-9_.$]+)\s+(any|[a-zA-Z0-9_.$]+)\s*\(([^()]*;?)+\)/g;
  const validSnortRules = [];
  let match;

  while ((match = snortPattern.exec(text)) !== null) {
    let openBraces = 0;
    let endIndex = match.index + match[0].length;

    for (let i = match.index; i < endIndex; i++) {
      if (text[i] === "(") openBraces++;
      else if (text[i] === ")") openBraces--;
    }

    while (openBraces > 0 && endIndex < text.length) {
      if (text[endIndex] === "(") openBraces++;
      else if (text[endIndex] === ")") openBraces--;
      endIndex++;
    }

    if (openBraces === 0) {
      validSnortRules.push(text.slice(match.index, endIndex));
    }
  }

  return validSnortRules;
};

const extractIOCs = async (text) => {
  const results = {};

  const extractionPromises = Object.entries(iocPatterns).map(([type, pattern]) => {
    return new Promise((resolve) => {
      const matches = text.match(pattern);
      results[type] = matches ? [...new Set(matches)] : [];
      resolve();
    });
  });

  await Promise.all(extractionPromises);
  
  results["yara"] = extractYaraRules(text);
  results["snort"] = extractSnortRules(text);

  return results;
};

export { extractIOCs };
