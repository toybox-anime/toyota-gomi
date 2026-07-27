// ===== 写真判定用マッピング =====
// MobileNet(ImageNet 1000分類)が返す英語ラベル → 分別辞典の品目 or カテゴリ。
// kw のいずれかがラベルに含まれれば一致（前方から評価、先勝ち）。
// item=DICT内のja名（カテゴリ・注記・多言語名を辞典から流用）。
// cat=直接カテゴリ（DICTに無い場合）。label=cat時の表示名。

const PHOTO_MAP = [
  { kw:["water bottle","pop bottle"], item:"ペットボトル" },
  { kw:["beer bottle","wine bottle"], item:"ガラスびん（飲料・食品）" },
  { kw:["beer can","pop can","tin can","canister"], item:"飲料缶（アルミ・スチール）" },
  { kw:["plastic bag"], item:"レジ袋" },
  { kw:["carton"], item:"段ボール" },
  { kw:["packet","envelope"], item:"雑誌・本" },
  { kw:["umbrella"], item:"傘（金属骨）" },
  { kw:["frying pan","wok","dutch oven","caldron","cauldron","pot,","skillet"], item:"なべ・フライパン" },
  { kw:["teapot","coffeepot","kettle"], item:"やかん" },
  { kw:["microwave"], item:"電子レンジ" },
  { kw:["refrigerator","icebox"], item:"冷蔵庫・冷凍庫" },
  { kw:["washer","washing machine"], item:"洗濯機・衣類乾燥機" },
  { kw:["television","monitor","screen","tv"], item:"テレビ" },
  { kw:["laptop","notebook","desktop computer","computer keyboard"], item:"パソコン" },
  { kw:["cellular","cellphone","mobile phone","ipod","remote control","hand-held computer"], item:"小型家電（金属主体）" },
  { kw:["diaper","nappy"], item:"紙おむつ" },
  { kw:["lighter","matchstick"], item:"使い捨てライター" },
  { kw:["ballpoint","fountain pen"], item:"ボールペン" },
  { kw:["toilet tissue","paper towel","handkerchief"], item:"ティッシュ" },
  { kw:["coffee mug","cup,"], item:"陶磁器・茶碗・皿" },
  { kw:["beaker","goblet","wine glass"], item:"ガラスコップ" },
  { kw:["vase"], item:"陶磁器・茶碗・皿" },
  { kw:["book jacket","comic book","binder"], item:"雑誌・本" },
  { kw:["running shoe","sandal","clog","loafer","cowboy boot"], item:"古着・古布" },
  { kw:["jersey","sweatshirt","cardigan","suit","gown","kimono","jean","miniskirt","cloak","poncho","abaya"], item:"古着・古布" },
  { kw:["backpack","purse","wallet","mailbag"], item:"革製品" },
  { kw:["banana","orange","pineapple","lemon","broccoli","cucumber","cabbage","mushroom","corn","pizza","bagel","pretzel","meat loaf","carbonara"], item:"生ごみ" },
  { kw:["wooden spoon","spatula","ladle"], cat:"moyasu",
    label:{ja:"木・プラの製品",en:"Wood/plastic product",pt:"Produto de madeira/plástico",easy:"き・プラの もの"} },
  { kw:["hammer","screwdriver","hatchet","plane","wrench","nail"], item:"金属製ハンガー" },
  { kw:["spray","hair spray","sunscreen"], item:"スプレー缶" },
];
