#!/usr/bin/env python3
"""Inline web/ (index.html, app.css, app.js) into one self-contained offline file: dist/api-dugout.html."""
import os
R = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(R, p), encoding="utf-8").read()
html = rd("web/index.html").replace("/*__CSS__*/", rd("web/app.css")).replace("/*__APP__*/", rd("web/app.js").replace("</script", "<\\/script"))
os.makedirs(os.path.join(R, "dist"), exist_ok=True)
open(os.path.join(R, "dist/api-dugout.html"), "w", encoding="utf-8").write(html)
print("built dist/api-dugout.html", len(html.encode()), "bytes")
