# 概要

AdventCalendarの集計に使うやつです。

下記フォーマットのCSVで吐き出されます。

```csv
date, name, title, url, LGTM
```

## HowTo

* `index.js`の変数、`GOTO_ADVENT_URL`にAdventCalendarTopのURLを入れてください。
  * ex: `const GOTO_ADVENT_URL = "https://qiita.com/advent-calendar/2020/javascript"`
* terminalに`node index`で実行。
* `yyyy_m_d_h_i.csv`が吐き出されるので煮るなり焼くなりスプレッドシートにインポートするなりしてください。
