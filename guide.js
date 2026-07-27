// ===== 分別ガイド（見て分かる版）=====
// 「出す場所」を軸に、各区分の定義・出せるもの・ルールを整理。
// place: どこに出すか（排出先）。収集日カテゴリ外（古紙/粗大/家電）も含む。

const PLACES = {
  station: { icon:"🗑️", color:"#5b6470",
    label:{ja:"分別ごみステーション", en:"Sorted-waste station", pt:"Estação de lixo", easy:"ごみ ステーション"},
    note:{ja:"収集日に、地区の集積所へ", en:"To your local spot on the collection day", pt:"No ponto local no dia da coleta", easy:"あつめる ひ に ちくの ばしょへ"} },
  shigen: { icon:"♻️", color:"#2f9e6e",
    label:{ja:"資源ステーション", en:"Resource station", pt:"Estação de recursos", easy:"しげん ステーション"},
    note:{ja:"資源の日に。有害・危険ごみもここ", en:"On resource day; also hazardous items", pt:"No dia de recursos; e perigosos", easy:"しげんの ひ に。あぶない ものも ここ"} },
  recycle: { icon:"📦", color:"#3a7cc0",
    label:{ja:"リサイクルステーション（常設拠点）", en:"Recycling station (drop-off)", pt:"Estação de reciclagem (ponto fixo)", easy:"リサイクル ステーション（いつでも）"},
    note:{ja:"古紙・古布等を持込。年中無休 10:00〜18:00（年末年始除く）", en:"Drop off paper/cloth. Daily 10:00–18:00", pt:"Leve papel/tecido. Diário 10h–18h", easy:"かみ・ぬのを もっていく。まいにち 10〜18じ"} },
  apply: { icon:"📞", color:"#7c5cbf",
    label:{ja:"粗大ごみ（申込制）", en:"Oversized (by request)", pt:"Volumoso (sob pedido)", easy:"そだい ごみ（もうしこみ）"},
    note:{ja:"事前申込・処理券が必要", en:"Requires prior request and a fee sticker", pt:"Requer pedido e selo", easy:"さきに もうしこみ・けんが いる"} },
  none: { icon:"⚠️", color:"#c0563a",
    label:{ja:"市では収集しない", en:"Not collected by city", pt:"Não coletado pela cidade", easy:"しやくしょは あつめない"},
    note:{ja:"販売店・メーカー・専門処理へ", en:"Take to retailer/maker/specialist", pt:"Leve à loja/fabricante", easy:"おみせ・メーカーへ"} },
};

// 「指定袋に入らない大きさ＝粗大ごみ」を全体ルールとして強調
const KEY_RULE = {
  ja:"迷ったら大きさで判断：市の指定袋に入れば通常収集、入らない大きさは『粗大ごみ』（申込制・長さ4mまで）。",
  en:"Rule of thumb: if it fits the city bag it's normal waste; if not, it's oversized (by request, up to 4 m).",
  pt:"Regra: se cabe na sacola oficial é lixo normal; se não, é volumoso (sob pedido, até 4 m).",
  easy:"おおきさで きめる：ふくろに はいれば ふつう、はいらなければ そだいごみ。",
};

const GUIDE = [
  { cat:"moyasu", place:"station",
    desc:{ja:"生ごみ・紙くず・布・製品プラなど。指定袋に入る大きさ。"},
    items:["生ごみ","紙くず","布類","革・ゴム製品","製品プラスチック（容器包装以外）","紙おむつ（汚物除く）"],
    rules:["指定袋に入れて収集日の朝8:30までに","長い枝などは束ねる・切って袋に入る大きさに","指定袋に入らない大きさは粗大ごみ"] },
  { cat:"plastic", place:"station",
    desc:{ja:"プラマークの付いた容器・包装。中身を軽くすすぐ。"},
    items:["食品トレイ","レジ袋","菓子袋","ボトルのフタ・ラベル","発泡スチロール"],
    rules:["汚れが落ちないものは燃やすごみへ","おもちゃ等の“製品プラ”は燃やすごみ"] },
  { cat:"shigen", place:"shigen",
    desc:{ja:"缶・びん・ペットボトルと、有害・危険ごみ。資源の日に資源ステーションへ。"},
    items:["飲料缶","ガラスびん","ペットボトル","乾電池・蛍光管（有害）","スプレー缶・ライター（危険）"],
    rules:["有害・危険ごみは資源ステーションへ","スプレー缶は使い切る／穴は開けない","ペットのフタ・ラベルはプラへ"] },
  { cat:"kinzoku", place:"station",
    desc:{ja:"金属製品。指定袋に入る大きさ。"},
    items:["なべ・フライパン","やかん","金属ハンガー","傘（金属骨）","小型の金属製品"],
    rules:["刃物は紙に包み「刃物」と表示","指定袋に入らない大きさは粗大ごみ"] },
  { cat:"umeru", place:"station",
    desc:{ja:"陶磁器・ガラス・土砂など、燃えない小物。"},
    items:["茶碗・皿（陶磁器）","ガラスコップ","鏡","植木鉢（陶器）","少量の土・砂・石"],
    rules:["割れ物は紙に包み「キケン」と表示"] },

  // ---- 収集日カテゴリ外（ここが分かりにくいポイント）----
  { key:"kosi", name:{ja:"古紙・古布（ダンボール等）", en:"Paper & cloth (cardboard)", pt:"Papel e tecido", easy:"かみ・ぬの（ダンボール）"},
    color:"#3a7cc0", icon:"📦", place:"recycle",
    desc:{ja:"ダンボール・新聞・雑誌・雑紙・紙パック・古布。ごみステーションでは回収しません。"},
    items:["ダンボール","新聞・チラシ","雑誌・本","雑紙","紙パック","古着・古布"],
    rules:["リサイクルステーション（常設拠点）か集団回収へ","拠点は年中無休 10:00〜18:00（年末年始除く）","種類ごとにひもで縛る"] },
  { key:"sodai", name:{ja:"粗大ごみ", en:"Oversized waste", pt:"Lixo volumoso", easy:"そだい ごみ"},
    color:"#7c5cbf", icon:"🛋️", place:"apply",
    desc:{ja:"市の指定袋に入らない大きさのもの（長さ4mまで）。"},
    items:["家具・タンス","布団・マットレス","自転車","電子レンジ","カーペット"],
    rules:["事前申込制・処理券が必要","家電4品目・パソコンは対象外（下記）"] },
  { key:"kaden", name:{ja:"家電・収集しないもの", en:"Appliances / not collected", pt:"Eletrodomésticos / não coletado", easy:"かでん・あつめない もの"},
    color:"#c0563a", icon:"📺", place:"none",
    desc:{ja:"テレビ・エアコン・冷蔵庫・洗濯機・パソコンは市では収集しません。"},
    items:["テレビ","エアコン","冷蔵庫・冷凍庫","洗濯機・乾燥機","パソコン"],
    rules:["家電4品目は販売店回収・指定引取場所へ","パソコンはメーカー回収・拠点回収へ"] },
];
