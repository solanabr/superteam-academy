# Installing Webfonts
Follow these simple Steps.

## 1.
Put `melodrama/` Folder into a Folder called `fonts/`.

## 2.
Put `melodrama.css` into your `css/` Folder.

## 3. (Optional)
You may adapt the `url('path')` in `melodrama.css` depends on your Website Filesystem.

## 4.
Import `melodrama.css` at the top of you main Stylesheet.

```
@import url('melodrama.css');
```

## 5.
You are now ready to use the following Rules in your CSS to specify each Font Style:
```
font-family: Melodrama-Light;
font-family: Melodrama-Regular;
font-family: Melodrama-Medium;
font-family: Melodrama-Semibold;
font-family: Melodrama-Bold;
font-family: Melodrama-Variable;

```
## 6. (Optional)
Use `font-variation-settings` rule to controll axes of variable fonts:
wght 300.0

Available axes:
'wght' (range from 300.0 to 700.0

