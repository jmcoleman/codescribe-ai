#!/bin/bash

# Fix DocPanel.test.jsx
file="client/src/components/__tests__/DocPanel.test.jsx"

# Add ThemeProvider import
sed -i '' '4a\
import { ThemeProvider } from '"'"'../../contexts/ThemeContext'"'"';
' "$file"

# Add helper function after beforeEach
sed -i '' '/localStorage.clear();/a\
\
  // Helper to render with ThemeProvider\
  const renderDocPanel = (props) => {\
    return render(\
      <ThemeProvider>\
        <DocPanel {...props} />\
      </ThemeProvider>\
    );\
  };
' "$file"

# Replace render(<DocPanel with renderDocPanel({
perl -i -pe 's/render\(<DocPanel /renderDocPanel({ /g' "$file"
# Replace />) with })
perl -i -pe 's/ \/>\)/})/g' "$file"

echo "Fixed DocPanel.test.jsx"
