# Installing Webfonts
Follow these simple Steps.

## 1.
Put `quilon/` Folder into a Folder called `fonts/`.

## 2.
Put `quilon.css` into your `css/` Folder.

## 3. (Optional)
You may adapt the `url('path')` in `quilon.css` depends on your Website Filesystem.

## 4.
Import `quilon.css` at the top of you main Stylesheet.

```
@import url('quilon.css');
```

## 5.
You are now ready to use the following Rules in your CSS to specify each Font Style:
```
font-family: Quilon-Regular;
font-family: Quilon-Medium;
font-family: Quilon-Semibold;
font-family: Quilon-Bold;
font-family: Quilon-Variable;

```
## 6. (Optional)
Use `font-variation-settings` rule to controll axes of variable fonts:
wght 400.0

Available axes:
'wght' (range from 400.0 to 700.0

