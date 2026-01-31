import React from "react";
import Editor from "@monaco-editor/react";

const JsEditor = ({ value, setValue }) => {
  return (
    <div className="rounded overflow-hidden shadow-sm">
      <Editor
        height="230px"           
        language="javascript"
        theme="vs-dark"
        value={value}
        onChange={setValue}     
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          
        }}
      />
    </div>
  );
};

export default JsEditor;
