const fs = require('fs');
const path = 'src/pages/UnifiedProfile.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix template literals for buttons
content = content.replace(
  /className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none \${activeTab === "influencer" \? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"\s+}/g,
  matched => matched.trimEnd() + "`" + "\n                "
);

content = content.replace(
  /className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none \${activeTab === "brand" \? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"\s+}/g,
  matched => matched.trimEnd() + "`" + "\n                "
);

// Fix bio rendering
content = content.replace('"{influencer.bio}"', '{influencer.bio}');

fs.writeFileSync(path, content);
console.log('Fixed syntax errors in UnifiedProfile.tsx');
