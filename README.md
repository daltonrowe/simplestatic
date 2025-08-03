# Simplestatic

A single 100 line, dependency / npm free script to generate basic static sites.

```zsh
# build all pages
node build.js

# build and replace one page
node build.js -f src/pages/mypage.html

# reload on change
node --watch-path=./src build.js
```
