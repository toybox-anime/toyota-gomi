// ===== 製品設定（自治体ごとに、ここだけ差し替えれば再納品できる）=====
const CONFIG = {
  cityName: "愛知県豊田市",
  cityShort: "豊田市",
  brandColor: "#2f9e6e",       // メインカラー（市のブランドに合わせて変更）
  brandColorDark: "#237a55",
  logo: "🗑️",                  // ロゴ絵文字 or 画像URL
  officialUrl: "https://www.city.toyota.aichi.jp/kurashi/gomi/gomi/1041628.html",
  dictUrl: "https://www.gomisaku.jp/0382/",
  appName: "ごみ収集日ガイド",
  languages: ["ja", "en", "pt", "easy"],
  defaultLang: "ja",
  dataUpdated: "2024年度版",     // データの版（毎年更新）
};

// ===== 多言語辞書 =====
const I18N = {
  ja:   { label:"日本語", appName:"ごみ収集日ガイド", search:"🔍 自治区・町名で検索", all:"全%d自治区", hit:"該当 %d 件",
          today:"今日", tomorrow:"明日", none:"今日の収集はありません", schedule:"収集スケジュール",
          next:"次は", sort:"分別早見表", rules:"出し方ルール", ruleTime:"時間", rulePlace:"場所",
          cal:"📅 カレンダーに追加（前日20時に通知）", calDone:"カレンダーに追加しました",
          dictQ:"これ何ごみ？", dictPh:"🔍 品目名で検索（例：ペットボトル、傘）", dictNone:"見つかりません。公式辞典をご確認ください", dictOfficial:"全品目は公式辞典へ",
          wd:["日","月","火","水","木","金","土"],
          cats:{moyasu:"燃やすごみ",plastic:"プラスチック製容器包装",shigen:"資源の日",kinzoku:"金属ごみ",umeru:"埋めるごみ"},
          weekly:"毎週 {d}曜", monthly:"第{w} {d}曜",
          timeTxt:"収集日の午前8時30分までに出す", placeTxt:"指定の集積場所・指定の袋で。指定日以外は出さない。" },
  en:   { label:"English", appName:"Garbage Collection Guide", search:"🔍 Search your district", all:"%d districts", hit:"%d found",
          today:"Today", tomorrow:"Tomorrow", none:"No collection today", schedule:"Collection schedule",
          next:"Next", sort:"Sorting guide", rules:"How to put out", ruleTime:"Time", rulePlace:"Place",
          cal:"📅 Add to calendar (reminder 8 PM day before)", calDone:"Added to your calendar",
          dictQ:"Which bin?", dictPh:"🔍 Search an item (e.g. bottle, umbrella)", dictNone:"Not found. Check the official dictionary", dictOfficial:"Full list: official dictionary",
          wd:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
          cats:{moyasu:"Burnable",plastic:"Plastic packaging",shigen:"Recyclables",kinzoku:"Metal",umeru:"Non-burnable"},
          weekly:"Every {d}", monthly:"{d} of week {w}",
          timeTxt:"Put out by 8:30 AM on collection day", placeTxt:"Use the designated spot and bag. Only on the designated day." },
  pt:   { label:"Português", appName:"Guia de Coleta de Lixo", search:"🔍 Busque seu bairro", all:"%d bairros", hit:"%d encontrados",
          today:"Hoje", tomorrow:"Amanhã", none:"Sem coleta hoje", schedule:"Programação de coleta",
          next:"Próximo", sort:"Guia de separação", rules:"Como descartar", ruleTime:"Horário", rulePlace:"Local",
          cal:"📅 Adicionar ao calendário (aviso 20h véspera)", calDone:"Adicionado ao calendário",
          dictQ:"Qual lixo?", dictPh:"🔍 Busque um item (ex: garrafa, guarda-chuva)", dictNone:"Não encontrado. Veja o dicionário oficial", dictOfficial:"Lista completa: dicionário oficial",
          wd:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
          cats:{moyasu:"Queimável",plastic:"Embalagem plástica",shigen:"Recicláveis",kinzoku:"Metal",umeru:"Não queimável"},
          weekly:"Toda {d}", monthly:"{d} da {w}ª semana",
          timeTxt:"Coloque até 8h30 no dia da coleta", placeTxt:"Use o local e a sacola indicados. Só no dia indicado." },
  easy: { label:"やさしい日本語", appName:"ごみの ひ ガイド", search:"🔍 じぶんの ちく を さがす", all:"ぜんぶで %d ちく", hit:"%d こ",
          today:"きょう", tomorrow:"あした", none:"きょうは ごみ を ださないで ください", schedule:"ごみの ひ",
          next:"つぎは", sort:"わけかた", rules:"だしかた", ruleTime:"じかん", rulePlace:"ばしょ",
          cal:"📅 カレンダーに いれる（まえの ひ 20じ に おしらせ）", calDone:"カレンダーに いれました",
          dictQ:"これ なにごみ？", dictPh:"🔍 なまえ で さがす（れい：ペットボトル、かさ）", dictNone:"みつかりません。こうしきを みてください", dictOfficial:"ぜんぶは こうしき じてん へ",
          wd:["にち","げつ","か","すい","もく","きん","ど"],
          cats:{moyasu:"もやす ごみ",plastic:"プラスチック",shigen:"しげん",kinzoku:"きんぞく ごみ",umeru:"うめる ごみ"},
          weekly:"まいしゅう {d}ようび", monthly:"だい{w} {d}ようび",
          timeTxt:"あさ 8じ30ぷん までに だす", placeTxt:"きめられた ばしょ・ふくろ で だす。きめられた ひ だけ。" },
};
