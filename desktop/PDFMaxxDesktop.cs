using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

class PDFMaxxDesktopApp {
    // ---- EMBEDDED HTML (injected at build time by build_standalone.py) ----
    static string EMBEDDED_HTML_B64 = "__PDFMAXX_HTML_B64_PLACEHOLDER__";

    [STAThread]
    static void Main() {
        string appDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PDFMaxx"
        );
        try { Directory.CreateDirectory(appDir); } catch { }
        string htmlPath = Path.Combine(appDir, "PDFMaxx_App.html");
        bool ready = false;

        // --- Strategy 1: Developer mode (running alongside src/ folder) ---
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string srcHtml = Path.Combine(baseDir, "src", "index.html");
        if (File.Exists(srcHtml)) {
            htmlPath = srcHtml;
            ready = true;
        }

        // --- Strategy 2: Sibling index.html (next to PDFMaxx.exe) ---
        if (!ready) {
            string rootHtml = Path.Combine(baseDir, "index.html");
            if (File.Exists(rootHtml)) {
                htmlPath = rootHtml;
                ready = true;
            }
        }

        // --- Strategy 3: Extract from Assembly Manifest Resource ---
        if (!ready) {
            try {
                Assembly asm = Assembly.GetExecutingAssembly();
                string[] resNames = asm.GetManifestResourceNames();
                string targetRes = null;
                foreach (string name in resNames) {
                    if (name.IndexOf("index.html", StringComparison.OrdinalIgnoreCase) >= 0) {
                        targetRes = name;
                        break;
                    }
                }
                if (targetRes != null) {
                    using (Stream resStream = asm.GetManifestResourceStream(targetRes)) {
                        if (resStream != null) {
                            using (FileStream fs = new FileStream(htmlPath, FileMode.Create, FileAccess.Write, FileShare.ReadWrite)) {
                                byte[] buf = new byte[65536];
                                int len;
                                while ((len = resStream.Read(buf, 0, buf.Length)) > 0) {
                                    fs.Write(buf, 0, len);
                                }
                            }
                            ready = true;
                        }
                    }
                }
            } catch {
                if (File.Exists(htmlPath)) ready = true;
            }
        }

        // --- Strategy 4: Extract from Base64 string in binary ---
        if (!ready && !string.IsNullOrEmpty(EMBEDDED_HTML_B64) && !EMBEDDED_HTML_B64.StartsWith("__PDFMAXX_")) {
            try {
                byte[] htmlBytes = Convert.FromBase64String(EMBEDDED_HTML_B64);
                File.WriteAllBytes(htmlPath, htmlBytes);
                ready = true;
            } catch {
                if (File.Exists(htmlPath)) ready = true;
            }
        }

        // Check if we have a valid HTML file to launch
        if (!ready && !File.Exists(htmlPath)) {
            MessageBox.Show(
                "Could not find or extract the PDFMaxx application files.\n\n" +
                "Looked in:\n" +
                "  - " + baseDir + "\n" +
                "  - " + htmlPath + "\n\n" +
                "Please ensure the application was built as a standalone executable.",
                "PDFMaxx Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        string fileUri = new Uri(htmlPath).AbsoluteUri;
        string appArgs = "--app=\"" + fileUri + "\" --window-size=1400,900 --disable-features=msWebOOUI";

        // Attempt 1: Detected Chromium browser executable
        string browser = FindChromiumBrowser();
        if (!string.IsNullOrEmpty(browser) && File.Exists(browser)) {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browser;
                psi.Arguments = appArgs;
                psi.UseShellExecute = false;
                Process.Start(psi);
                return;
            } catch { }
        }

        // Attempt 2: Try short names via PATH
        string[] shortNames = new string[] { "msedge.exe", "chrome.exe", "brave.exe" };
        foreach (string name in shortNames) {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = name;
                psi.Arguments = appArgs;
                psi.UseShellExecute = true;
                Process.Start(psi);
                return;
            } catch { }
        }

        // Attempt 3: Last resort — open with system default handler
        try {
            Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
        } catch {
            MessageBox.Show(
                "Could not find a modern browser to open PDFMaxx.\n\n" +
                "PDFMaxx requires Microsoft Edge, Google Chrome, or Brave Browser.\n" +
                "Please install one of these browsers to continue.",
                "PDFMaxx — Browser Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    static string FindChromiumBrowser() {
        // 1. Check App Paths in Windows Registry (standard installation registration)
        string[] appNames = new string[] { "msedge.exe", "chrome.exe", "brave.exe", "vivaldi.exe" };
        foreach (string app in appNames) {
            string p = GetAppPathFromRegistry(app);
            if (!string.IsNullOrEmpty(p) && File.Exists(p)) return p;
        }

        // 2. Check standard Program Files and LocalAppData paths
        string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string progFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        string[] candidatePaths = new string[] {
            // Edge
            Path.Combine(progFilesX86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(progFiles, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(localAppData, @"Microsoft\Edge\Application\msedge.exe"),
            // Chrome
            Path.Combine(progFiles, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(progFilesX86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(localAppData, @"Google\Chrome\Application\chrome.exe"),
            // Brave
            Path.Combine(progFiles, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(progFilesX86, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(localAppData, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
        };

        foreach (string path in candidatePaths) {
            if (!string.IsNullOrEmpty(path) && File.Exists(path)) return path;
        }

        // 3. Check EdgeCore (present on Windows 10/11)
        try {
            string edgeCoreDir = Path.Combine(progFilesX86, @"Microsoft\EdgeCore");
            if (Directory.Exists(edgeCoreDir)) {
                string[] files = Directory.GetFiles(edgeCoreDir, "msedge.exe", SearchOption.AllDirectories);
                if (files.Length > 0 && File.Exists(files[0])) return files[0];
            }
        } catch { }

        // 4. Check registry ProgId for browsers
        string[] progIdKeys = new string[] {
            @"MSEdgeHTM\shell\open\command",
            @"ChromeHTML\shell\open\command",
            @"BraveHTML\shell\open\command"
        };
        foreach (string regKey in progIdKeys) {
            string p = GetExecutableFromRegistryKey(regKey);
            if (!string.IsNullOrEmpty(p) && File.Exists(p)) return p;
        }

        return null;
    }

    static string GetAppPathFromRegistry(string appName) {
        string subKey = @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + appName;
        try {
            using (RegistryKey key = Registry.LocalMachine.OpenSubKey(subKey)) {
                if (key != null) {
                    string val = key.GetValue(null) as string;
                    if (!string.IsNullOrEmpty(val)) return CleanPath(val);
                }
            }
        } catch { }
        try {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(subKey)) {
                if (key != null) {
                    string val = key.GetValue(null) as string;
                    if (!string.IsNullOrEmpty(val)) return CleanPath(val);
                }
            }
        } catch { }
        return null;
    }

    static string GetExecutableFromRegistryKey(string regKey) {
        try {
            using (RegistryKey key = Registry.ClassesRoot.OpenSubKey(regKey)) {
                if (key != null) {
                    string cmd = key.GetValue(null) as string;
                    if (!string.IsNullOrEmpty(cmd)) return CleanPath(cmd);
                }
            }
        } catch { }
        return null;
    }

    static string CleanPath(string cmd) {
        cmd = cmd.Trim();
        if (cmd.StartsWith("\"")) {
            int q2 = cmd.IndexOf('"', 1);
            if (q2 > 1) return cmd.Substring(1, q2 - 1);
        }
        int space = cmd.IndexOf(' ');
        return (space > 0) ? cmd.Substring(0, space) : cmd;
    }
}
