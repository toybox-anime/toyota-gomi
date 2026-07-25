// ===== 分別辞典（多言語・主要品目）=====
// cat: 収集日カテゴリ(moyasu/plastic/shigen/kinzoku/umeru) または特別区分(sodai/kaden/shudan/none)
// note: 補足（ja/en/pt）。有害・危険ごみは資源の日に「資源ステーション」へ。
// ※ 主要品目のみ。全品目は豊田市公式辞典で要確認（製品版は公式データ提携で全件化）。

const DICT_EXTRA = {
  sodai:  { icon:"🛋️", color:"#7c5cbf", ja:"粗大ごみ",       en:"Oversized",            pt:"Volumoso",
            note:{ja:"申込制・処理券が必要", en:"By request; fee sticker needed", pt:"Sob solicitação; selo necessário"} },
  kaden:  { icon:"📺", color:"#c0563a", ja:"家電リサイクル", en:"Appliance recycling",  pt:"Reciclagem de eletrodomésticos",
            note:{ja:"市では収集しない。販売店・指定引取場所へ", en:"Not collected by city; take to retailer", pt:"Não coletado; leve à loja"} },
  shudan: { icon:"📦", color:"#3a7cc0", ja:"集団回収・拠点回収", en:"Community / drop-off", pt:"Coleta comunitária",
            note:{ja:"古紙・古布など。集団回収か拠点へ", en:"Paper/cloth: community or drop-off", pt:"Papel/tecido: coleta comunitária"} },
  none:   { icon:"⚠️", color:"#8a8f98", ja:"収集しない",     en:"Not collected",        pt:"Não coletado",
            note:{ja:"適正処理業者・専門店へ", en:"Take to a proper disposal service", pt:"Leve a serviço apropriado"} },
};

const HAZARD = { ja:"有害・危険ごみ → 資源ステーションへ", en:"Hazardous → resource station", pt:"Perigoso → estação de recursos" };

const DICT = [
  // --- 燃やすごみ ---
  { ja:"生ごみ", yomi:"なまごみ", en:"Food waste", pt:"Restos de comida", cat:"moyasu" },
  { ja:"紙くず", yomi:"かみくず", en:"Paper scraps", pt:"Restos de papel", cat:"moyasu" },
  { ja:"ティッシュ", yomi:"てぃっしゅ", en:"Tissues", pt:"Lenços de papel", cat:"moyasu" },
  { ja:"紙おむつ", yomi:"かみおむつ", en:"Diapers", pt:"Fraldas", cat:"moyasu", note:{ja:"汚物は取り除く", en:"Remove waste first", pt:"Remova os dejetos"} },
  { ja:"割り箸", yomi:"わりばし", en:"Disposable chopsticks", pt:"Hashi descartável", cat:"moyasu" },
  { ja:"革製品", yomi:"かわせいひん", en:"Leather goods", pt:"Artigos de couro", cat:"moyasu" },
  { ja:"ゴム製品", yomi:"ごむせいひん", en:"Rubber goods", pt:"Artigos de borracha", cat:"moyasu" },
  { ja:"おむつ以外の衣類・布", yomi:"いるい", en:"Cloth / clothing (small)", pt:"Tecido / roupa (pouco)", cat:"moyasu" },
  { ja:"プラスチック製品（容器包装以外）", yomi:"ぷらせいひん", en:"Plastic products (non-packaging)", pt:"Produtos plásticos (não embalagem)", cat:"moyasu", note:{ja:"おもちゃ・バケツ等の硬いプラ製品", en:"Hard plastic goods (toys, buckets)", pt:"Plásticos rígidos (brinquedos, baldes)"} },
  { ja:"おもちゃ（プラ製）", yomi:"おもちゃ", en:"Toys (plastic)", pt:"Brinquedos (plástico)", cat:"moyasu" },
  { ja:"歯ブラシ", yomi:"はぶらし", en:"Toothbrush", pt:"Escova de dentes", cat:"moyasu" },
  { ja:"ボールペン", yomi:"ぼーるぺん", en:"Ballpoint pen", pt:"Caneta", cat:"moyasu" },
  { ja:"CD・DVD", yomi:"しーでぃー", en:"CD / DVD", pt:"CD / DVD", cat:"moyasu" },
  { ja:"使い捨てカイロ", yomi:"かいろ", en:"Disposable hand warmer", pt:"Aquecedor descartável", cat:"moyasu" },
  { ja:"保冷剤", yomi:"ほれいざい", en:"Ice pack (gel)", pt:"Bolsa de gelo (gel)", cat:"moyasu" },
  { ja:"食用油（紙・布に吸わせる）", yomi:"しょくようあぶら", en:"Cooking oil (absorb it)", pt:"Óleo de cozinha (absorver)", cat:"moyasu" },
  { ja:"剪定枝（50cm以下）", yomi:"せんていえだ", en:"Pruned branches (≤50cm)", pt:"Galhos podados (≤50cm)", cat:"moyasu" },
  { ja:"落ち葉・草", yomi:"おちば", en:"Fallen leaves / grass", pt:"Folhas / grama", cat:"moyasu" },

  // --- プラスチック製容器包装 ---
  { ja:"食品トレイ", yomi:"とれい", en:"Food tray", pt:"Bandeja de alimento", cat:"plastic" },
  { ja:"レジ袋", yomi:"れじぶくろ", en:"Shopping bag", pt:"Sacola plástica", cat:"plastic" },
  { ja:"お菓子の袋", yomi:"おかしのふくろ", en:"Snack bag", pt:"Embalagem de doces", cat:"plastic" },
  { ja:"ラップ", yomi:"らっぷ", en:"Plastic wrap", pt:"Filme plástico", cat:"plastic" },
  { ja:"ペットボトルのフタ・ラベル", yomi:"ふた", en:"PET bottle cap / label", pt:"Tampa / rótulo de PET", cat:"plastic" },
  { ja:"発泡スチロール", yomi:"はっぽうすちろーる", en:"Styrofoam", pt:"Isopor", cat:"plastic" },
  { ja:"シャンプーの容器", yomi:"しゃんぷー", en:"Shampoo bottle", pt:"Frasco de xampu", cat:"plastic" },
  { ja:"卵のパック", yomi:"たまごのぱっく", en:"Egg carton (plastic)", pt:"Embalagem de ovos", cat:"plastic" },
  { ja:"チューブ容器", yomi:"ちゅーぶ", en:"Tube container", pt:"Bisnaga", cat:"plastic" },

  // --- 資源（缶・びん・ペット） ---
  { ja:"飲料缶（アルミ・スチール）", yomi:"かん", en:"Beverage can", pt:"Lata de bebida", cat:"shigen" },
  { ja:"ガラスびん（飲料・食品）", yomi:"びん", en:"Glass bottle", pt:"Garrafa de vidro", cat:"shigen" },
  { ja:"ペットボトル", yomi:"ぺっとぼとる", en:"PET bottle", pt:"Garrafa PET", cat:"shigen", note:{ja:"フタ・ラベルはプラへ", en:"Cap/label go to plastic", pt:"Tampa/rótulo vão ao plástico"} },

  // --- 有害・危険ごみ（資源の日／資源ステーション） ---
  { ja:"乾電池", yomi:"かんでんち", en:"Dry battery", pt:"Pilha", cat:"shigen", note:HAZARD },
  { ja:"蛍光管・蛍光灯", yomi:"けいこうかん", en:"Fluorescent tube", pt:"Lâmpada fluorescente", cat:"shigen", note:HAZARD },
  { ja:"電球（白熱・LED）", yomi:"でんきゅう", en:"Light bulb", pt:"Lâmpada", cat:"shigen", note:HAZARD },
  { ja:"スプレー缶", yomi:"すぷれーかん", en:"Spray can", pt:"Lata de spray", cat:"shigen", note:{ja:"使い切る・穴は開けない→資源ステーション", en:"Empty it, don't puncture → resource station", pt:"Esvazie, não fure → estação"} },
  { ja:"カセットボンベ", yomi:"かせっとぼんべ", en:"Gas cartridge", pt:"Cartucho de gás", cat:"shigen", note:{ja:"使い切る→資源ステーション", en:"Empty it → resource station", pt:"Esvazie → estação"} },
  { ja:"使い捨てライター", yomi:"らいたー", en:"Lighter", pt:"Isqueiro", cat:"shigen", note:{ja:"ガスを抜く→資源ステーション", en:"Empty the gas → resource station", pt:"Esvazie o gás → estação"} },
  { ja:"水銀体温計", yomi:"たいおんけい", en:"Mercury thermometer", pt:"Termômetro de mercúrio", cat:"shigen", note:HAZARD },

  // --- 金属ごみ ---
  { ja:"なべ・フライパン", yomi:"なべ", en:"Pot / frying pan", pt:"Panela / frigideira", cat:"kinzoku" },
  { ja:"やかん", yomi:"やかん", en:"Kettle", pt:"Chaleira", cat:"kinzoku" },
  { ja:"包丁（金属）", yomi:"ほうちょう", en:"Kitchen knife", pt:"Faca", cat:"kinzoku", note:{ja:"紙で包み「刃物」と表示", en:"Wrap in paper, label 'blade'", pt:"Embrulhe e marque 'lâmina'"} },
  { ja:"金属製ハンガー", yomi:"はんがー", en:"Metal hanger", pt:"Cabide de metal", cat:"kinzoku" },
  { ja:"傘（金属骨）", yomi:"かさ", en:"Umbrella (metal frame)", pt:"Guarda-chuva (metal)", cat:"kinzoku" },
  { ja:"針金・金具", yomi:"はりがね", en:"Wire / metal fittings", pt:"Arame / ferragem", cat:"kinzoku" },
  { ja:"一斗缶", yomi:"いっとかん", en:"Metal can (large)", pt:"Lata grande de metal", cat:"kinzoku" },
  { ja:"小型家電（金属主体）", yomi:"こがたかでん", en:"Small appliance (metal)", pt:"Pequeno eletrônico (metal)", cat:"kinzoku" },
  { ja:"アルミホイル", yomi:"あるみほいる", en:"Aluminum foil", pt:"Papel alumínio", cat:"kinzoku" },

  // --- 埋めるごみ ---
  { ja:"陶磁器・茶碗・皿", yomi:"とうじき", en:"Ceramics / dishes", pt:"Cerâmica / pratos", cat:"umeru" },
  { ja:"ガラスコップ", yomi:"がらすこっぷ", en:"Glass cup", pt:"Copo de vidro", cat:"umeru" },
  { ja:"板ガラス・割れたガラス", yomi:"いたがらす", en:"Sheet / broken glass", pt:"Vidro plano / quebrado", cat:"umeru", note:{ja:"紙で包み「キケン」と表示", en:"Wrap, label 'danger'", pt:"Embrulhe, marque 'perigo'"} },
  { ja:"鏡", yomi:"かがみ", en:"Mirror", pt:"Espelho", cat:"umeru" },
  { ja:"植木鉢（陶器）", yomi:"うえきばち", en:"Flower pot (ceramic)", pt:"Vaso (cerâmica)", cat:"umeru" },
  { ja:"土・砂（少量）", yomi:"つち", en:"Soil / sand (small)", pt:"Terra / areia (pouco)", cat:"umeru" },
  { ja:"石・ブロック（少量）", yomi:"いし", en:"Stone (small)", pt:"Pedra (pouco)", cat:"umeru" },

  // --- 粗大ごみ ---
  { ja:"家具（タンス・机）", yomi:"かぐ", en:"Furniture", pt:"Móveis", cat:"sodai" },
  { ja:"布団・マットレス", yomi:"ふとん", en:"Futon / mattress", pt:"Futon / colchão", cat:"sodai" },
  { ja:"自転車", yomi:"じてんしゃ", en:"Bicycle", pt:"Bicicleta", cat:"sodai" },
  { ja:"カーペット・じゅうたん", yomi:"かーぺっと", en:"Carpet / rug", pt:"Tapete", cat:"sodai" },
  { ja:"電子レンジ", yomi:"でんしれんじ", en:"Microwave oven", pt:"Micro-ondas", cat:"sodai" },
  { ja:"ストーブ・ファンヒーター", yomi:"すとーぶ", en:"Heater / stove", pt:"Aquecedor", cat:"sodai", note:{ja:"電池・灯油は抜く", en:"Remove battery/kerosene", pt:"Remova pilha/querosene"} },

  // --- 家電リサイクル（収集しない） ---
  { ja:"テレビ", yomi:"てれび", en:"TV", pt:"Televisão", cat:"kaden" },
  { ja:"エアコン", yomi:"えあこん", en:"Air conditioner", pt:"Ar-condicionado", cat:"kaden" },
  { ja:"冷蔵庫・冷凍庫", yomi:"れいぞうこ", en:"Refrigerator", pt:"Geladeira", cat:"kaden" },
  { ja:"洗濯機・衣類乾燥機", yomi:"せんたくき", en:"Washing machine", pt:"Máquina de lavar", cat:"kaden" },
  { ja:"パソコン", yomi:"ぱそこん", en:"PC / computer", pt:"Computador", cat:"kaden", note:{ja:"メーカー回収・拠点回収へ", en:"Maker/drop-off recycling", pt:"Reciclagem do fabricante"} },

  // --- 集団回収・拠点回収（古紙・古布） ---
  { ja:"新聞・チラシ", yomi:"しんぶん", en:"Newspaper", pt:"Jornal", cat:"shudan" },
  { ja:"雑誌・本", yomi:"ざっし", en:"Magazine / book", pt:"Revista / livro", cat:"shudan" },
  { ja:"段ボール", yomi:"だんぼーる", en:"Cardboard", pt:"Papelão", cat:"shudan" },
  { ja:"紙パック（洗って開く）", yomi:"かみぱっく", en:"Carton (rinse & open)", pt:"Cartão (lave e abra)", cat:"shudan" },
  { ja:"古着・古布", yomi:"ふるぎ", en:"Used clothes", pt:"Roupas usadas", cat:"shudan" },

  // --- 収集しない・専門処理 ---
  { ja:"消火器", yomi:"しょうかき", en:"Fire extinguisher", pt:"Extintor", cat:"none", note:{ja:"販売店・専門業者へ", en:"Take to dealer/specialist", pt:"Leve ao vendedor"} },
  { ja:"バイク・原付", yomi:"ばいく", en:"Motorcycle", pt:"Motocicleta", cat:"none" },
  { ja:"ガスボンベ（大）", yomi:"がすぼんべ", en:"Gas cylinder (large)", pt:"Botijão de gás", cat:"none" },
  { ja:"農薬・劇物", yomi:"のうやく", en:"Pesticide / toxic", pt:"Agrotóxico", cat:"none" },
];
