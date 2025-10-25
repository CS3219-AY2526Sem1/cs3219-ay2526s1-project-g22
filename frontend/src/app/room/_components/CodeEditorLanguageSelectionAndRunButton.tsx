import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

function CodeEditorLanguageSelectionAndRunButton({
  selectedLanguage,
  setSelectedLanguage,
  setCode,
  availableLanguages,
  executeCode,
  isBlocked,
  languageMap,
}: {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  availableLanguages: string[];
  executeCode: () => void;
  isBlocked: boolean;
  languageMap: typeof import("@/utils/language-config").languageMap;
}) {
  const handleChange = (lang: string) => {
    setSelectedLanguage(lang);
  };
  return (
    <div className="flex gap-4 items-center p-4 bg-slate-800/50">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-300">Language:</label>
        <Select value={selectedLanguage} onValueChange={handleChange}>
          <SelectTrigger className="bg-slate-700/80 border-slate-600 text-white w-40 h-9 hover:bg-slate-600/80 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {availableLanguages.map((lang) => (
              <SelectItem
                key={lang}
                value={lang}
                className="text-white hover:bg-slate-600 focus:bg-slate-600"
              >
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        onClick={executeCode}
        disabled={
          !languageMap[selectedLanguage as keyof typeof languageMap] ||
          isBlocked
        }
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 
                   text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 
                   disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed 
                   transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
      >
        Run Code
      </button>

      {!languageMap[selectedLanguage as keyof typeof languageMap] && (
        <span className="text-xs text-amber-400">
          Execution not supported for {selectedLanguage}
        </span>
      )}
    </div>
  );
}

export default CodeEditorLanguageSelectionAndRunButton;
