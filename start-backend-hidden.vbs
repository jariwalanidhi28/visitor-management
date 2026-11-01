Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\darsh\visitor-management\backend"
WshShell.Run "node server.js", 0, False
Set WshShell = Nothing
