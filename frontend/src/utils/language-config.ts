import { indentUnit } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
export const languageConfigs = {
  python: {
    pistonLang: "python",
    version: "3.12.0",
    files: (code: string, tests?: string) => [
      // tests FIRST, as the entrypoint
      {
        name: "main.py",
        content: `
import json
results=[]
def test(name,fn):
  try:
    fn(); results.append({"name":name,"pass":True})
  except Exception as e:
    results.append({"name":name,"pass":False,"error":str(e)})

from solution import *
${tests ?? ""}
print(json.dumps({"results":results}))
        `.trim(),
      },
      { name: "solution.py", content: code },
    ],
    // no command needed for python — Piston runs the first file
  },

  javascript: {
    pistonLang: "javascript",
    version: "18.15.0",
    files: (code: string, tests?: string) => [
      {
        name: "main.js",
        content: `
const results=[];
global.test = async (name,fn)=>{ try{ await fn(); results.push({name,pass:true}); }catch(e){ results.push({name,pass:false,error:String(e&&e.message||e)}); } };
global.assert = { equal(a,b,msg){ if(a!==b) throw new Error(msg ?? \`Expected \${a}===\${b}\`) } };

// load user code
require("./solution.js");

// run tests and print JSON
(async () => {
  ${tests ?? ""}
  console.log(JSON.stringify({ results }));
})().catch(e => console.log(JSON.stringify({ results:[{name:"__runner",pass:false,error:String(e)}] })));
        `.trim(),
      },
      { name: "solution.js", content: code },
    ],
    // no command needed for javascript — Piston runs the first file
  },
} as const;

export const languageMap = {
  Python: {
    apiLang: "python" as const,
    extension: [python(), indentUnit.of("    ")], // Python uses 4 spaces for indentation
    testTemplate: `
def t1(): assert add(1,2)==3
def t2(): assert add(0,0)==0
test("1+2=3", t1)
test("0+0=0", t2)
    `.trim(),
  },
  JavaScript: {
    apiLang: "javascript" as const,
    extension: [javascript(), indentUnit.of("  ")], // JavaScript uses 2 spaces for indentation
    testTemplate: `
test("1+2=3", () => assert.equal(add(1,2), 3));
test("0+0=0", () => assert.equal(add(0,0), 0));
    `.trim(),
  },
} as const;
