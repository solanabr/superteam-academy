# Installing Webfonts
Follow these simple Steps.

## 1.
Put `supreme/` Folder into a Folder called `fonts/`.

## 2.
Put `supreme.css` into your `css/` Folder.

## 3. (Optional)
You may adapt the `url('path')` in `supreme.css` depends on your Website Filesystem.

## 4.
Import `supreme.css` at the top of you main Stylesheet.

```
@import url('supreme.css');
```

## 5.
You are now ready to use the following Rules in your CSS to specify each Font Style:
```
font-family: Supreme-Thin;
font-family: Supreme-ThinItalic;
font-family: Supreme-Extralight;
font-family: Supreme-ExtralightItalic;
font-family: Supreme-Light;
font-family: Supreme-LightItalic;
font-family: Supreme-Regular;
font-family: Supreme-Italic;
font-family: Supreme-Medium;
font-family: Supreme-MediumItalic;
font-family: Supreme-Bold;
font-family: Supreme-BoldItalic;
font-family: Supreme-Extrabold;
font-family: Supreme-ExtraboldItalic;
font-family: Supreme-Variable;
font-family: Supreme-VariableItalic;

```
## 6. (Optional)
Use `font-variation-settings` rule to controll axes of variable fonts:
wght 800.0

Available axes:
'wght' (range from 100.0 to 800.0

