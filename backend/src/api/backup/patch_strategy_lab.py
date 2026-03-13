#!/usr/bin/env python3
"""Patch strategy_lab.py with hyperopt fixes"""

import re

with open('/opt/Multibotdashboard/backend/src/api/strategy_lab.py', 'r') as f:
    content = f.read()

# Fix 1: Add available_spaces initialization
content = content.replace(
    'strategy_file_path = None\n            strategy_class = strategy_name\n            for root, dirs, files in os.walk',
    'strategy_file_path = None\n            strategy_class = strategy_name\n            available_spaces = []  # FIX: Initialize here\n            for root, dirs, files in os.walk'
)

# Fix 2: Replace hyperopt space detection
old_detection = '''# Detect available hyperopt spaces
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*buy', strategy_content, re.IGNORECASE):
                                available_spaces.append('buy')
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*sell', strategy_content, re.IGNORECASE):
                                available_spaces.append('sell')
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*protection', strategy_content, re.IGNORECASE):
                                available_spaces.append('protection')
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*stoploss', strategy_content, re.IGNORECASE):
                                available_spaces.append('stoploss')
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*roi', strategy_content, re.IGNORECASE):
                                available_spaces.append('roi')
                            if re.search(r'(IntParameter|DecimalParameter|CategoricalParameter|RealParameter).*trailing', strategy_content, re.IGNORECASE):
                                available_spaces.append('trailing')'''

new_detection = '''# Detect available hyperopt spaces (FIXED)
                            content_clean = re.sub(r'#.*', '', strategy_content)
                            if re.search(r'\\w*buy\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('buy')
                            if re.search(r'\\w*sell\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('sell')
                            if re.search(r'\\w*protection\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('protection')
                            if re.search(r'\\w*stoploss\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('stoploss')
                            if re.search(r'\\w*roi\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('roi')
                            if re.search(r'\\w*trailing\\w*\\s*=\\s*(Int|Decimal|Categorical|Real)Parameter', content_clean, re.I):
                                available_spaces.append('trailing')'''

content = content.replace(old_detection, new_detection)

with open('/opt/Multibotdashboard/backend/src/api/strategy_lab.py', 'w') as f:
    f.write(content)

print("Patched successfully!")
