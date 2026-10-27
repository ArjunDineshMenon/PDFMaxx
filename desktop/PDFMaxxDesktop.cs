using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;

class PDFMaxxDesktopApp {
    // ---- EMBEDDED HTML (injected at build time by build_standalone.py) ----
    // This marker is replaced during build with the base64-encoded bundled index.html
    static string EMBEDDED_HTML_B64 = "__PDFMAXX_HTML_B64_PLACEHOLDER__";

    [STAThread]
    static void Main() {
        string appDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PDFMaxx"
        );
        Directory.CreateDirectory(appDir);
        string htmlPath = Path.Combine(appDir, "PDFMaxx_App.html");

        // --- Strategy 1: If running alongside src/ folder (developer mode), use that ---
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string srcHtml = Path.Combine(baseDir, "src", "index.html");
        if (File.Exists(srcHtml)) {
            htmlPath = srcHtml;
        }
        // --- Strategy 2: If bundled index.html exists next to exe, use that ---
        else {
            string rootHtml = Path.Combine(baseDir, "index.html");
            if (File.Exists(rootHtml)) {
                htmlPath = rootHtml;
            }
            // --- Strategy 3: Extract embedded HTML from within EXE ---
            else if (EMBEDDED_HTML_B64 != "__PDFMAXX_HTML_B64_PLACEHOLDER__") {
                try {
                    byte[] htmlBytes = Convert.FromBase64String(EMBEDDED_HTML_B64);
                    File.WriteAllBytes(htmlPath, htmlBytes);
                } catch (Exception ex) {
                    MessageBox.Show("Failed to extract embedded app: " + ex.Message,
                        "PDFMaxx Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }
            else {
                MessageBox.Show(
                    "Could not find the PDFMaxx application files.\n\n" +
                    "Please ensure either:\n" +
                    "  - src/index.html exists next to PDFMaxx.exe (developer mode)\n" +
                    "  - index.html exists next to PDFMaxx.exe\n" +
                    "  - The EXE was built with embedded HTML (standalone mode)\n\n" +
                    "Looked in: " + baseDir,
                    "PDFMaxx Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }

        if (!File.Exists(htmlPath)) {
            MessageBox.Show("Could not find app HTML at: " + htmlPath,
                "PDFMaxx Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        string fileUri = new Uri(htmlPath).AbsoluteUri;
        string appArgs = "--app=\"" + fileUri + "\" --window-size=1400,900 --disable-features=msWebOOUI";

        // Try known Chromium browser paths
        string[] browserPaths = new string[] {
            @"C:\Program Files\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            @"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        };

        foreach (string browser in browserPaths) {
            try {
                if (!File.Exists(browser)) continue;
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browser;
                psi.Arguments = appArgs;
                psi.UseShellExecute = false;
                Process.Start(psi);
                return;
            } catch { }
        }

        // Try short names via PATH
        string[] shortNames = new string[] { "chrome.exe", "brave.exe", "msedge.exe" };
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

        // Fallback: look up default browser from registry
        try {
            string[] regKeys = new string[] {
                @"ChromeHTML\shell\open\command",
                @"BraveHTML\shell\open\command",
                @"MSEdgeHTM\shell\open\command"
            };
            foreach (string regKey in regKeys) {
                using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.ClassesRoot.OpenSubKey(regKey)) {
                    if (key != null) {
                        string cmd = key.GetValue(null) as string;
                        if (!string.IsNullOrEmpty(cmd)) {
                            int q1 = cmd.IndexOf('"');
                            int q2 = cmd.IndexOf('"', q1 + 1);
                            string exePath = (q1 >= 0 && q2 > q1) ? cmd.Substring(q1 + 1, q2 - q1 - 1) : cmd.Split(' ')[0];
                            if (File.Exists(exePath)) {
                                ProcessStartInfo psi = new ProcessStartInfo();
                                psi.FileName = exePath;
                                psi.Arguments = appArgs;
                                psi.UseShellExecute = false;
                                Process.Start(psi);
                                return;
                            }
                        }
                    }
                }
            }
        } catch { }

        // Last resort: open with system default
        try {
            Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
        } catch {
            MessageBox.Show(
                "Could not find a Chromium-based browser (Chrome, Edge, or Brave).\n\n" +
                "PDFMaxx requires a modern browser to run.\n" +
                "Please install Google Chrome, Microsoft Edge, or Brave Browser.",
                "PDFMaxx — Browser Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }
}
