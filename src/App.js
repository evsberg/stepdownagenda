import React, { useRef, useState, useEffect } from "react";
import "./styles.css";
import moment from "moment";

import Editor from "@monaco-editor/react";
import CurrentInfo from "./CurrentInfo";

function getCurrentValue(text, editor) {
  if (!editor) {
    return null;
  }

  const now = moment();
  if (!now.isValid()) {
    return null;
  }

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const currentDay = now.local().format("ddd").toUpperCase();

  const daySections = text
    .split(/(?:\r\n|\r|\n)(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:\r\n|\r|\n)/)
    .filter(Boolean);

  const dayIndex = daysOfWeek.indexOf(currentDay);
  const todaySchedule = daySections[dayIndex].trim();
  const nextDaySchedule = daySections[(dayIndex + 1) % 7].trim();

  // Combine today's and next day's schedules
  const combinedSchedule = todaySchedule + "\n" + nextDaySchedule;

  const values = combinedSchedule
    .trim()
    .split(/\s*\d{4}\s*/)
    .filter(Boolean);
  const times = combinedSchedule.match(/\d{4}/g);
  if (!times) {
    return null;
  }
  const timeObjects = times.map((time, index) => {
    const hour = parseInt(time.slice(0, 2));
    const minute = parseInt(time.slice(2, 4));
    const date = moment().set({ hour, minute, second: 0, millisecond: 0 });

    // Add 1 day offset to the next day's times
    if (index >= todaySchedule.match(/\d{4}/g).length) {
      date.add(1, "day");
    }

    return date;
  });
  const tasks = values.slice(1);

  let startTime = null; // Initialize startTime to null

  for (let i = 0; i < timeObjects.length; i++) {
    const time = timeObjects[i];
    const nextTimeIndex = (i + 1) % timeObjects.length;
    const nextTime = timeObjects[nextTimeIndex];
    if (now.isBetween(time, nextTime)) {
      const timeToNext = Math.ceil(
        moment.duration(nextTime.diff(now)).asMinutes()
      );
      const nextTimeFormatted = nextTime.format("HHmm");

      // Set the startTime to null if it's the first value in the list
      startTime = i === 0 ? null : timeObjects[i].format("h:mm A");

      let nextTask = tasks[i];

      return {
        value: values[i],
        timeToNext,
        nextTime: nextTimeFormatted,
        nextTask,
        startTime,
        time
      };
    }
  }

  return null;
}

function App() {
  const monacoRef = useRef(null);
  const [currentValue, setCurrentValue] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);

  function handleEditorWillMount(monaco) {
    // Register the new language
    monaco.languages.register({ id: "stepdown" });

    // Define the language tokens
    monaco.languages.setMonarchTokensProvider("stepdown", {
      keywords: ["Given", "When", "Then", "And", "But"],
      tokenizer: {
        root: [
          [/\b(Given|When|Then|And|But)\b/, "keyword"],
          [/([01]\d|2[0-3])[0-5]\d/, "24hrtime"],
          [/^- .*$/, "checklist"]
        ]
      }
    });

    // Define the new theme
    monaco.editor.defineTheme("stepdown-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "ffa500" },
        { token: "24hrtime", foreground: "569CD7" },
        { token: "checklist", foreground: "00FF00" }
      ],
      colors: {}
    });
  }

  function handleEditorDidMount(editor, monaco) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor;

    // Update the current value when the editor content changes
    editor.onDidChangeModelContent(() => {
      const text = editor.getValue();
      const value = getCurrentValue(text, editor);
      setCurrentValue(value);
    });

    // Update the current value and time when the minute changes
    const tick = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      setCurrentTime(timeString);

      const text = editor.getValue();
      const value = getCurrentValue(text, editor);
      setCurrentValue(value);
    };
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }

  useEffect(() => {
    // Initialize the current value

    const editor = monacoRef.current;
    if (!editor) {
      return;
    }

    const text = editor.getValue();
    const value = getCurrentValue(text, editor);
    setCurrentValue(value);

    // Add event listener to toggle editor on Ctrl + \
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.keyCode === 220) {
        // 220 is the keycode for '\'
        editor.updateOptions({ readOnly: false });
        const editorDiv = document.querySelector(".editor-container");
        if (editorDiv) {
          editorDiv.style.display =
            editorDiv.style.display === "none" ? "block" : "none";
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [monacoRef.current]);

  return (
    <>
      <div class="container">
        <div class="editor-container" style={{ display: "none" }}>
          <Editor
            height="100vh"
            width="100%"
            theme="stepdown-theme"
            defaultLanguage="stepdown"
            defaultValue={`MON
0700
Wake up
0900
Work
1800
Dinner

TUE
0600 Wake up
0900 Breakfast
1000 Work on agenda app
1100 Fix motorbike
1700 Go to hill
2000 Work on agenda app

WED
0700
Wake up
0900
Work
1800
Dinner

THU
0700
Wake up
0900
Work
1800
Dinner

FRI
0700
Wake up
0900
Work
1800
Dinner

SAT
0700
Wake up
0900
Work
1800
Dinner

SUN
0700
Wake up
0900
Work
1800
Dinner
`}
            className="editor"
            onMount={handleEditorDidMount}
            beforeMount={handleEditorWillMount}
            options={{
              lineNumbers: "off",
              fontSize: "16",
              minimap: { enabled: false },
              wordWrap: "on",
              scrollbar: { vertical: "hidden", horizontal: "hidden" },
              overviewRulerBorder: false // <-- added closing curly brace here
            }}
          />
        </div>
        <CurrentInfo time={currentTime} currentValue={currentValue} />
      </div>
    </>
  );
}

export default App;
