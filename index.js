const puppeteer = require("puppeteer")

// === please set advent calendar page url ===
const GOTO_ADVENT_URL = ""

const URL_PATTERN_QIITA = /^https:\/\/qiita.com\//
const LGTM_QIITA_CLASS_NAME = "a.it-Footer_likeCount"
const LGTM_NOTE_CLASS_NAME = "span.o-noteContentText__likeCount"

;(async () => {
  console.log("start")
  // init
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // { date, name, title, url }
  const adventPages = await extractAdventPages(page, GOTO_ADVENT_URL)

  // { date, name, title, url, LGTM }
  const adventPagesWithLGTM = await extractLGTM(page, adventPages)

  csvCreate(adventPagesWithLGTM)

  process.exit(0)
})()

const extractLGTM = async (page, adventPages) => {
  console.log("aggregate LGTM...")
  const _obj = []
  for (adventPage of adventPages) {
    if (adventPage.title === "" || adventPage.url === "") break
    await page.goto(adventPage.url)
    // qiitaかnoteしかいない前提, 更に多岐に渡る場合改修する
    const lgtmClassName = URL_PATTERN_QIITA.test(adventPage.url)
      ? LGTM_QIITA_CLASS_NAME
      : LGTM_NOTE_CLASS_NAME
    const lgtmElm = await page.$(lgtmClassName)
    const lgtm = await page.evaluate((_elm) => _elm.textContent, lgtmElm)
    _obj.push({
      date: adventPage.date,
      name: adventPage.name,
      title: adventPage.title,
      url: adventPage.url,
      LGTM: lgtm,
    })
    // 負荷がかからないよう、1秒waitつける
    await page.waitForTimeout(1000)
  }
  return _obj
}

/**
 * @param {puppeteer.page} page
 * @param {string} url advent calendar's
 *
 * @return advent calendar article object {date, name, title, url}
 */
const extractAdventPages = async (page, url) => {
  console.log("access advent calendar page...")
  await page.goto(url)
  const adventCalendarItems = await page.$$(`div.${"adventCalendarItem"}`)
  const adventPages = []
  for (adventCalendarItem of adventCalendarItems) {
    const adventPage = await page.evaluate((itemElm) => {
      let date = ""
      let name = ""
      let title = ""
      let url = ""
      itemElm.childNodes.forEach((e) => {
        if (e.className === "adventCalendarItem_date") {
          date = e.textContent
          return
        }
        const nameElm = e.getElementsByClassName("adventCalendarItem_author")
        const articleElm = e.querySelector(".adventCalendarItem_entry > a")
        name = nameElm !== null ? nameElm[0].textContent : ""
        if (articleElm) {
          title = articleElm.textContent
          url = articleElm.href
        }
      })
      return {
        date: date.replace(/\s+/g, ""),
        name: name.trim(),
        title: title,
        url: url,
      }
    }, adventCalendarItem)
    adventPages.push(adventPage)
  }
  return adventPages
}

const stringifySync = require("csv-stringify/lib/sync")
const fs = require("fs")

const csvCreate = (records) => {
  console.log("output csv...")
  const target = Object.getOwnPropertyNames(records[0])
  const columns = {}
  for (let key of target) {
    columns[key] = key
  }
  const csvString = stringifySync(records, {
    header: true,
    columns,
    quoted_string: true,
  })
  try {
    const today = new Date()
    // yyyy_m_d-h_i.csv
    const todayString = `${today.getFullYear()}_${
      today.getMonth() + 1
    }_${today.getDate()}_${today.getHours()}_${today.getMinutes()}`
    fs.writeFileSync(`${todayString}.csv`, csvString)
    console.log("output complete")
  } catch (error) {
    console.log("error：", error)
  }
}
