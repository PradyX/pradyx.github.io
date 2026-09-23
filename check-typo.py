with open('/Users/prady/Projects/portfolio/eleventy.config.js') as f:
    lines = f.readlines()
line15 = lines[14]  # 0-indexed
print(repr(line15))
# Find the method call
import re
m = re.search(r'add[A-Za-z]+Copy', line15)
if m:
    word = m.group(0)
    print('Method found:', repr(word))
    print('Length:', len(word))
    print('Chars:', list(word))
