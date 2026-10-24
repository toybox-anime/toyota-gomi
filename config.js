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
  // ---- リユース掲示板（ゆずります）----
  cityId: "toyota",              // APIの city 識別子
  reuseApi: "https://gomi-reuse-api.reuse-api.workers.dev",   // Worker のURL。空なら「準備中」表示
  turnstileSiteKey: "0x4AAAAAAExf5RIFYt4U9_Bn",               // Cloudflare Turnstile のサイトキー（公開値）
};

// ===== 多言語辞書 =====
const I18N = {
  ja:   { pushOn:"前の日の夜8時に通知を受け取る", pushIsOn:"通知オン：前の日の夜8時にお知らせします", pushOff:"通知を止める", pushTest:"テスト通知を送る", pushTestSent:"送りました。数秒で届きます", pushDenied:"通知が許可されていません。端末の設定で、このサイトの通知を許可してください", pushIos:"iPhoneでは、共有ボタン→「ホーム画面に追加」で追加したアプリから通知を使えます", pushErr:"通知を設定できませんでした。時間をおいてもう一度お試しください", pushMsg:"明日は{c}の日です（朝{t}まで）", pushNone:"明日の収集はありません", calShort:"カレンダーに追加", sodaiH:"粗大ごみを出したいとき", sodai1:"まだ使えるなら、捨てる前に「ゆずります」で近所の人に譲れます", sodaiReuse:"ゆずりますを見る", sodai2:"捨てるときは、先に申し込みが必要です", sodaiApply:"申し込みページ", sodaiCall:"電話で申し込む", sodaiInfo:"市の案内を見る", guideOther:"分別の詳しい内容は、市の公式ページをご覧ください", guideOfficial:"市の公式ページ", welcomeH:"ようこそ、{c}へ", welcomeLead:"ごみを出す日は、住んでいる地区で決まっています。3つだけ設定しましょう。", welcome1:"住んでいる地区を選ぶ", welcome2:"前の日の通知をオンにする", welcome3:"分別ガイドを見る", welcomeDone:"はじめる", bigText:"文字を大きく", sayNext:"{d}は、{c}の日です。朝{t}までに出してください。", vList:"リスト", vMonth:"月で見る", prevM:"前の月", nextM:"次の月", nextDay:"次のごみの日", after:"そのあと", dayAfter:"あさって", inDays:"あと{n}日", timeShort:"朝{t}まで", todayDone:"今日の{c}は朝{t}まででした", privacy:"使い方の改善のため、匿名の利用件数（検索された品目など）を集計しています。個人や端末を特定する情報は送りません。", label:"日本語", appName:"ごみ収集日ガイド", search:"🔍 自治区・町名で検索", all:"全%d自治区", hit:"該当 %d 件",
          today:"今日", tomorrow:"明日", none:"今日の収集はありません", schedule:"収集スケジュール",
          next:"次は", sort:"分別早見表", rules:"出し方ルール", ruleTime:"時間", rulePlace:"場所",
          cal:"📅 カレンダーに追加（前日20時に通知）", calDone:"カレンダーに追加しました",
          dictQ:"これ何ごみ？", dictPh:"🔍 品目名で検索（例：ペットボトル、傘）", dictNone:"見つかりません。公式辞典をご確認ください", dictOfficial:"全品目は公式辞典へ",
          tabS:"収集日", tabG:"分別ガイド", tabR:"ゆずります", noneShort:"収集なし", change:"変更", week:"この1週間", pickFirst:"まず、お住まいの自治区を選んでください", gPlace:"出す場所", gItems:"出せるもの", gRules:"ルール",
          phTitle:"📷 写真でわけかた（ベータ）", phBtn:"写真をとる／選ぶ", phLoading:"AIモデルを読み込み中…", phAnalyzing:"解析中…", phConf:"確度", phNoMatch:"うまく判定できませんでした。上の検索をお試しください。", phDisclaim:"AIによる参考判定です（ベータ）。最終確認は分別辞典で。",
          wd:["日","月","火","水","木","金","土"],
          cats:{moyasu:"燃やすごみ",plastic:"プラスチック製容器包装",shigen:"資源の日",kinzoku:"金属ごみ",umeru:"埋めるごみ"},
          weekly:"毎週 {d}曜", monthly:"第{w} {d}曜",
          timeTxt:"収集日の朝{t}までに出す", placeTxt:"指定の集積場所・指定の袋で。指定日以外は出さない。" },
  en:   { pushOn:"Get a reminder at 8 PM the day before", pushIsOn:"Reminders on: 8 PM the day before", pushOff:"Turn off", pushTest:"Send a test", pushTestSent:"Sent. It should arrive in a few seconds", pushDenied:"Notifications are blocked. Allow them for this site in your device settings", pushIos:"On iPhone, add this app to your Home Screen (Share → Add to Home Screen) to use reminders", pushErr:"Couldn't set up reminders. Please try again later", pushMsg:"Tomorrow: {c} (by {t})", pushNone:"No collection tomorrow", calShort:"Add to calendar", sodaiH:"Getting rid of large items", sodai1:"If it still works, give it to a neighbor first with Give away", sodaiReuse:"Open Give away", sodai2:"To dispose of it, you need to apply in advance", sodaiApply:"Apply online", sodaiCall:"Apply by phone", sodaiInfo:"City information", guideOther:"For detailed sorting rules, see the city's official page", guideOfficial:"City official page", welcomeH:"Welcome to {c}", welcomeLead:"Collection days depend on your district. Three quick steps:", welcome1:"Choose your district", welcome2:"Turn on reminders", welcome3:"Read the sorting guide", welcomeDone:"Start", bigText:"Larger text", sayNext:"{d}: put out {c} by {t}.", vList:"List", vMonth:"Month", prevM:"Previous month", nextM:"Next month", nextDay:"Next collection", after:"Coming up", dayAfter:"In 2 days", inDays:"in {n} days", timeShort:"By {t}", todayDone:"Today's {c} was due by {t}", privacy:"To improve this service we count anonymous usage (e.g. items searched). Nothing that identifies you or your device is sent.", label:"English", appName:"Garbage Collection Guide", search:"🔍 Search your district", all:"%d districts", hit:"%d found",
          today:"Today", tomorrow:"Tomorrow", none:"No collection today", schedule:"Collection schedule",
          next:"Next", sort:"Sorting guide", rules:"How to put out", ruleTime:"Time", rulePlace:"Place",
          cal:"📅 Add to calendar (reminder 8 PM day before)", calDone:"Added to your calendar",
          dictQ:"Which bin?", dictPh:"🔍 Search an item (e.g. bottle, umbrella)", dictNone:"Not found. Check the official dictionary", dictOfficial:"Full list: official dictionary",
          tabS:"Schedule", tabG:"Sorting guide", tabR:"Give away", noneShort:"No collection", change:"Change", week:"Next 7 days", pickFirst:"First, choose your district", gPlace:"Where to put", gItems:"Examples", gRules:"Rules",
          phTitle:"📷 Photo sort (beta)", phBtn:"Take / choose a photo", phLoading:"Loading AI model…", phAnalyzing:"Analyzing…", phConf:"confidence", phNoMatch:"Could not identify. Try the search above.", phDisclaim:"AI estimate (beta). Please confirm with the dictionary.",
          wd:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
          cats:{moyasu:"Burnable",plastic:"Plastic packaging",shigen:"Recyclables",kinzoku:"Metal",umeru:"Non-burnable"},
          weekly:"Every {d}", monthly:"{d} of week {w}",
          timeTxt:"Put out by {t} on collection day", placeTxt:"Use the designated spot and bag. Only on the designated day." },
  pt:   { pushOn:"Receber aviso às 20h da véspera", pushIsOn:"Avisos ativados: 20h da véspera", pushOff:"Desativar", pushTest:"Enviar teste", pushTestSent:"Enviado. Deve chegar em segundos", pushDenied:"As notificações estão bloqueadas. Permita-as para este site nas configurações", pushIos:"No iPhone, adicione à Tela de Início (Compartilhar → Adicionar à Tela de Início) para usar avisos", pushErr:"Não foi possível ativar os avisos. Tente mais tarde", pushMsg:"Amanhã: {c} (até {t})", pushNone:"Sem coleta amanhã", calShort:"Adicionar ao calendário", sodaiH:"Para descartar itens grandes", sodai1:"Se ainda funciona, doe a um vizinho antes, em Doação", sodaiReuse:"Ver Doação", sodai2:"Para descartar, é preciso agendar antes", sodaiApply:"Agendar online", sodaiCall:"Agendar por telefone", sodaiInfo:"Informação da prefeitura", guideOther:"Para regras detalhadas de separação, veja a página oficial da prefeitura", guideOfficial:"Página oficial", welcomeH:"Bem-vindo a {c}", welcomeLead:"Os dias de coleta dependem do seu bairro. Três passos rápidos:", welcome1:"Escolha seu bairro", welcome2:"Ative os avisos", welcome3:"Veja o guia de separação", welcomeDone:"Começar", bigText:"Letras maiores", sayNext:"{d}: coloque {c} até {t}.", vList:"Lista", vMonth:"Mês", prevM:"Mês anterior", nextM:"Próximo mês", nextDay:"Próxima coleta", after:"Depois", dayAfter:"Depois de amanhã", inDays:"em {n} dias", timeShort:"Até {t}", todayDone:"Hoje ({c}) foi até {t}", privacy:"Para melhorar o serviço, contamos o uso de forma anônima (ex.: itens pesquisados). Nada que identifique você ou seu aparelho é enviado.", label:"Português", appName:"Guia de Coleta de Lixo", search:"🔍 Busque seu bairro", all:"%d bairros", hit:"%d encontrados",
          today:"Hoje", tomorrow:"Amanhã", none:"Sem coleta hoje", schedule:"Programação de coleta",
          next:"Próximo", sort:"Guia de separação", rules:"Como descartar", ruleTime:"Horário", rulePlace:"Local",
          cal:"📅 Adicionar ao calendário (aviso 20h véspera)", calDone:"Adicionado ao calendário",
          dictQ:"Qual lixo?", dictPh:"🔍 Busque um item (ex: garrafa, guarda-chuva)", dictNone:"Não encontrado. Veja o dicionário oficial", dictOfficial:"Lista completa: dicionário oficial",
          tabS:"Coleta", tabG:"Guia de separação", tabR:"Doação", noneShort:"Sem coleta", change:"Alterar", week:"Próximos 7 dias", pickFirst:"Primeiro, escolha seu bairro", gPlace:"Onde descartar", gItems:"Exemplos", gRules:"Regras",
          phTitle:"📷 Separar por foto (beta)", phBtn:"Tirar / escolher foto", phLoading:"Carregando modelo de IA…", phAnalyzing:"Analisando…", phConf:"confiança", phNoMatch:"Não identificado. Use a busca acima.", phDisclaim:"Estimativa de IA (beta). Confirme no dicionário.",
          wd:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
          cats:{moyasu:"Queimável",plastic:"Embalagem plástica",shigen:"Recicláveis",kinzoku:"Metal",umeru:"Não queimável"},
          weekly:"Toda {d}", monthly:"{d} da {w}ª semana",
          timeTxt:"Coloque até {t} no dia da coleta", placeTxt:"Use o local e a sacola indicados. Só no dia indicado." },
  easy: { pushOn:"まえの ひの よる 8じに おしらせを うけとる", pushIsOn:"おしらせ オン：まえの ひの よる 8じ", pushOff:"おしらせを とめる", pushTest:"ためしに おくる", pushTestSent:"おくりました", pushDenied:"おしらせが ゆるされて いません。せっていで ゆるして ください", pushIos:"iPhoneは「ホームがめんに ついか」を してから つかえます", pushErr:"できません でした。あとで もういちど", pushMsg:"あしたは {c}の ひ です（あさ {t} まで）", pushNone:"あしたは ありません", calShort:"カレンダーに いれる", sodaiH:"おおきい ごみを だしたい とき", sodai1:"まだ つかえるなら「ゆずります」で ちかくの ひとに あげられます", sodaiReuse:"ゆずりますを みる", sodai2:"すてる ときは さきに もうしこみ が いります", sodaiApply:"もうしこみ", sodaiCall:"でんわで もうしこむ", sodaiInfo:"しやくしょの あんない", guideOther:"わけかたは しやくしょの ページを みて ください", guideOfficial:"しやくしょの ページ", welcomeH:"{c}へ ようこそ", welcomeLead:"ごみの ひは すんでいる ちくで ちがいます。3つ だけ やりましょう。", welcome1:"すんでいる ちくを えらぶ", welcome2:"おしらせを オンにする", welcome3:"わけかたを みる", welcomeDone:"はじめる", bigText:"じを おおきく", sayNext:"{d}は {c}の ひ です。あさ {t} までに だして ください。", vList:"リスト", vMonth:"つきで みる", prevM:"まえの つき", nextM:"つぎの つき", nextDay:"つぎの ごみの ひ", after:"そのあと", dayAfter:"あさって", inDays:"あと {n}にち", timeShort:"あさ {t} まで", todayDone:"きょうの {c}は あさ {t} まで でした", privacy:"アプリを よくするため、つかわれた かず だけを かぞえています。あなたの ことが わかる じょうほうは おくりません。", label:"やさしい日本語", appName:"ごみの ひ ガイド", search:"🔍 じぶんの ちく を さがす", all:"ぜんぶで %d ちく", hit:"%d こ",
          today:"きょう", tomorrow:"あした", none:"きょうは ごみ を ださないで ください", schedule:"ごみの ひ",
          next:"つぎは", sort:"わけかた", rules:"だしかた", ruleTime:"じかん", rulePlace:"ばしょ",
          cal:"📅 カレンダーに いれる（まえの ひ 20じ に おしらせ）", calDone:"カレンダーに いれました",
          dictQ:"これ なにごみ？", dictPh:"🔍 なまえ で さがす（れい：ペットボトル、かさ）", dictNone:"みつかりません。こうしきを みてください", dictOfficial:"ぜんぶは こうしき じてん へ",
          tabS:"あつめる ひ", tabG:"わけかた ガイド", tabR:"ゆずります", noneShort:"ありません", change:"かえる", week:"1しゅうかん", pickFirst:"まず、すんでいる ちく を えらんで ください", gPlace:"だす ばしょ", gItems:"だせる もの", gRules:"ルール",
          phTitle:"📷 しゃしんで わけかた（ベータ）", phBtn:"しゃしんを とる／えらぶ", phLoading:"AIを よみこみちゅう…", phAnalyzing:"みています…", phConf:"たしからしさ", phNoMatch:"わかりませんでした。うえで さがしてください。", phDisclaim:"AIの さんこうです（ベータ）。さいごは じてんで かくにん。",
          wd:["にち","げつ","か","すい","もく","きん","ど"],
          cats:{moyasu:"もやす ごみ",plastic:"プラスチック",shigen:"しげん",kinzoku:"きんぞく ごみ",umeru:"うめる ごみ"},
          weekly:"まいしゅう {d}ようび", monthly:"だい{w} {d}ようび",
          timeTxt:"あさ {t} までに だす", placeTxt:"きめられた ばしょ・ふくろ で だす。きめられた ひ だけ。" },
};
