import zipfile

xml_content = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Algorithm Design and Analysis is a fundamental branch of computer science. An algorithm is a step-by-step procedure for solving a problem or performing a computation. A characteristic of a good algorithm is that it must be unambiguous, finite, and efficient. Time complexity is typically measured using Big O notation, which describes the upper bound of the running time of an algorithm in the worst-case scenario. Space complexity measures the amount of memory an algorithm uses relative to the input size.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
"""

with zipfile.ZipFile("c:/lysa/questionwhiz-standalone/frontend/public/test.docx", "w") as docx:
    docx.writestr("word/document.xml", xml_content)
print("Created test.docx successfully in public folder")
