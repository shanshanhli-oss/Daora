/**
 * Offline gazetteer for birth place. Coordinates are city-centre approximations;
 * timezones are IANA names so historical daylight saving can be applied later.
 * Anywhere not listed can be entered as latitude, longitude and a timezone.
 */
const RAW = `
London|伦敦|United Kingdom|英国|51.5074|-0.1278|Europe/London
Brighton|布莱顿|United Kingdom|英国|50.8225|-0.1372|Europe/London
Manchester|曼彻斯特|United Kingdom|英国|53.4808|-2.2426|Europe/London
Edinburgh|爱丁堡|United Kingdom|英国|55.9533|-3.1883|Europe/London
Birmingham|伯明翰|United Kingdom|英国|52.4862|-1.8904|Europe/London
Glasgow|格拉斯哥|United Kingdom|英国|55.8642|-4.2518|Europe/London
Liverpool|利物浦|United Kingdom|英国|53.4084|-2.9916|Europe/London
Leeds|利兹|United Kingdom|英国|53.8008|-1.5491|Europe/London
Bristol|布里斯托尔|United Kingdom|英国|51.4545|-2.5879|Europe/London
Cardiff|加的夫|United Kingdom|英国|51.4816|-3.1791|Europe/London
Belfast|贝尔法斯特|United Kingdom|英国|54.5973|-5.9301|Europe/London
Oxford|牛津|United Kingdom|英国|51.7520|-1.2577|Europe/London
Cambridge|剑桥|United Kingdom|英国|52.2053|0.1218|Europe/London
York|约克|United Kingdom|英国|53.9600|-1.0873|Europe/London
Nottingham|诺丁汉|United Kingdom|英国|52.9548|-1.1581|Europe/London
Sheffield|谢菲尔德|United Kingdom|英国|53.3811|-1.4701|Europe/London
Newcastle|纽卡斯尔|United Kingdom|英国|54.9783|-1.6178|Europe/London
Southampton|南安普顿|United Kingdom|英国|50.9097|-1.4044|Europe/London
Plymouth|普利茅斯|United Kingdom|英国|50.3755|-4.1427|Europe/London
Aberdeen|阿伯丁|United Kingdom|英国|57.1497|-2.0943|Europe/London
Dundee|邓迪|United Kingdom|英国|56.4620|-2.9707|Europe/London
Inverness|因弗内斯|United Kingdom|英国|57.4778|-4.2247|Europe/London
Bath|巴斯|United Kingdom|英国|51.3811|-2.3590|Europe/London
Canterbury|坎特伯雷|United Kingdom|英国|51.2802|1.0789|Europe/London
Norwich|诺里奇|United Kingdom|英国|52.6309|1.2974|Europe/London
Exeter|埃克塞特|United Kingdom|英国|50.7184|-3.5339|Europe/London
Coventry|考文垂|United Kingdom|英国|52.4068|-1.5197|Europe/London
Leicester|莱斯特|United Kingdom|英国|52.6369|-1.1398|Europe/London
Reading|雷丁|United Kingdom|英国|51.4543|-0.9781|Europe/London
Portsmouth|朴茨茅斯|United Kingdom|英国|50.8198|-1.0880|Europe/London
Swansea|斯旺西|United Kingdom|英国|51.6214|-3.9436|Europe/London
Stirling|斯特灵|United Kingdom|英国|56.1165|-3.9369|Europe/London
Derby|德比|United Kingdom|英国|52.9225|-1.4746|Europe/London
Wolverhampton|伍尔弗汉普顿|United Kingdom|英国|52.5862|-2.1288|Europe/London
Stoke-on-Trent|斯托克|United Kingdom|英国|53.0027|-2.1794|Europe/London
Sunderland|桑德兰|United Kingdom|英国|54.9069|-1.3838|Europe/London
Bournemouth|伯恩茅斯|United Kingdom|英国|50.7192|-1.8808|Europe/London
Swindon|斯温顿|United Kingdom|英国|51.5558|-1.7797|Europe/London
Milton Keynes|米尔顿凯恩斯|United Kingdom|英国|52.0406|-0.7594|Europe/London
Luton|卢顿|United Kingdom|英国|51.8787|-0.4200|Europe/London
Northampton|北安普顿|United Kingdom|英国|52.2405|-0.9027|Europe/London
Ipswich|伊普斯维奇|United Kingdom|英国|52.0567|1.1482|Europe/London
Cheltenham|切尔滕纳姆|United Kingdom|英国|51.8994|-2.0783|Europe/London
Durham|达勒姆|United Kingdom|英国|54.7753|-1.5849|Europe/London
Carlisle|卡莱尔|United Kingdom|英国|54.8951|-2.9382|Europe/London
Perth|珀斯|United Kingdom|英国|56.3950|-3.4308|Europe/London
Bangor|班戈|United Kingdom|英国|53.2274|-4.1293|Europe/London
Derry|德里|United Kingdom|英国|54.9966|-7.3086|Europe/London
Newport|纽波特|United Kingdom|英国|51.5842|-2.9977|Europe/London
Gloucester|格洛斯特|United Kingdom|英国|51.8642|-2.2382|Europe/London
Peterborough|彼得伯勒|United Kingdom|英国|52.5695|-0.2405|Europe/London
Blackpool|布莱克浦|United Kingdom|英国|53.8175|-3.0357|Europe/London
Middlesbrough|米德尔斯堡|United Kingdom|英国|54.5742|-1.2350|Europe/London
Kingston upon Hull|赫尔|United Kingdom|英国|53.7676|-0.3274|Europe/London
Preston|普雷斯顿|United Kingdom|英国|53.7632|-2.7031|Europe/London
Southend-on-Sea|绍森德|United Kingdom|英国|51.5459|0.7077|Europe/London
Worthing|沃辛|United Kingdom|英国|50.8179|-0.3729|Europe/London
Eastbourne|伊斯特本|United Kingdom|英国|50.7680|0.2905|Europe/London
Guildford|吉尔福德|United Kingdom|英国|51.2362|-0.5704|Europe/London
Winchester|温彻斯特|United Kingdom|英国|51.0632|-1.3080|Europe/London
Salisbury|索尔兹伯里|United Kingdom|英国|51.0688|-1.7945|Europe/London
Truro|特鲁罗|United Kingdom|英国|50.2632|-5.0510|Europe/London
St Andrews|圣安德鲁斯|United Kingdom|英国|56.3398|-2.7967|Europe/London
Fort William|威廉堡|United Kingdom|英国|56.8198|-5.1052|Europe/London
Oban|奥班|United Kingdom|英国|56.4151|-5.4718|Europe/London
Lerwick|勒威克|United Kingdom|英国|60.1550|-1.1450|Europe/London
Douglas|道格拉斯|Isle of Man|马恩岛|54.1523|-4.4861|Europe/Isle_of_Man
St Helier|圣赫利尔|Jersey|泽西|49.1862|-2.1066|Europe/Jersey
St Peter Port|圣彼得港|Guernsey|根西|49.4550|-2.5360|Europe/Guernsey
Beijing|北京|China|中国|39.9042|116.4074|Asia/Shanghai
Shanghai|上海|China|中国|31.2304|121.4737|Asia/Shanghai
Guangzhou|广州|China|中国|23.1291|113.2644|Asia/Shanghai
Shenzhen|深圳|China|中国|22.5431|114.0579|Asia/Shanghai
Chengdu|成都|China|中国|30.5728|104.0668|Asia/Shanghai
Hangzhou|杭州|China|中国|30.2741|120.1551|Asia/Shanghai
Nanjing|南京|China|中国|32.0603|118.7969|Asia/Shanghai
Wuhan|武汉|China|中国|30.5928|114.3055|Asia/Shanghai
Xi'an|西安|China|中国|34.3416|108.9398|Asia/Shanghai
Chongqing|重庆|China|中国|29.5630|106.5516|Asia/Shanghai
Tianjin|天津|China|中国|39.3434|117.3616|Asia/Shanghai
Suzhou|苏州|China|中国|31.2989|120.5853|Asia/Shanghai
Qingdao|青岛|China|中国|36.0671|120.3826|Asia/Shanghai
Dalian|大连|China|中国|38.9140|121.6147|Asia/Shanghai
Xiamen|厦门|China|中国|24.4798|118.0894|Asia/Shanghai
Kunming|昆明|China|中国|25.0389|102.7183|Asia/Shanghai
Harbin|哈尔滨|China|中国|45.8038|126.5340|Asia/Shanghai
Changsha|长沙|China|中国|28.2282|112.9388|Asia/Shanghai
Zhengzhou|郑州|China|中国|34.7466|113.6254|Asia/Shanghai
Jinan|济南|China|中国|36.6512|117.1201|Asia/Shanghai
Fuzhou|福州|China|中国|26.0745|119.2965|Asia/Shanghai
Hefei|合肥|China|中国|31.8206|117.2272|Asia/Shanghai
Nanning|南宁|China|中国|22.8170|108.3665|Asia/Shanghai
Shenyang|沈阳|China|中国|41.8057|123.4315|Asia/Shanghai
Changchun|长春|China|中国|43.8171|125.3235|Asia/Shanghai
Urumqi|乌鲁木齐|China|中国|43.8256|87.6168|Asia/Urumqi
Lhasa|拉萨|China|中国|29.6520|91.1721|Asia/Shanghai
Hohhot|呼和浩特|China|中国|40.8424|111.7492|Asia/Shanghai
Yinchuan|银川|China|中国|38.4872|106.2309|Asia/Shanghai
Xining|西宁|China|中国|36.6171|101.7782|Asia/Shanghai
Lanzhou|兰州|China|中国|36.0611|103.8343|Asia/Shanghai
Guiyang|贵阳|China|中国|26.6470|106.6302|Asia/Shanghai
Haikou|海口|China|中国|20.0440|110.1999|Asia/Shanghai
Sanya|三亚|China|中国|18.2528|109.5120|Asia/Shanghai
Zhuhai|珠海|China|中国|22.2710|113.5767|Asia/Shanghai
Dongguan|东莞|China|中国|23.0205|113.7518|Asia/Shanghai
Foshan|佛山|China|中国|23.0215|113.1214|Asia/Shanghai
Wuxi|无锡|China|中国|31.4912|120.3119|Asia/Shanghai
Ningbo|宁波|China|中国|29.8683|121.5440|Asia/Shanghai
Wenzhou|温州|China|中国|28.0006|120.6994|Asia/Shanghai
Nanchang|南昌|China|中国|28.6820|115.8579|Asia/Shanghai
Taiyuan|太原|China|中国|37.8706|112.5489|Asia/Shanghai
Shijiazhuang|石家庄|China|中国|38.0428|114.5149|Asia/Shanghai
Hong Kong|香港|China|中国|22.3193|114.1694|Asia/Hong_Kong
Macau|澳门|China|中国|22.1987|113.5439|Asia/Macau
Taipei|台北|Taiwan|中国台湾|25.0330|121.5654|Asia/Taipei
Kaohsiung|高雄|Taiwan|中国台湾|22.6273|120.3014|Asia/Taipei
Taichung|台中|Taiwan|中国台湾|24.1477|120.6736|Asia/Taipei
Tainan|台南|Taiwan|中国台湾|22.9999|120.2270|Asia/Taipei
Changzhou|常州|China|中国|31.8107|119.9741|Asia/Shanghai
Nantong|南通|China|中国|31.9802|120.8943|Asia/Shanghai
Xuzhou|徐州|China|中国|34.2044|117.2858|Asia/Shanghai
Yangzhou|扬州|China|中国|32.3932|119.4127|Asia/Shanghai
Jiaxing|嘉兴|China|中国|30.7468|120.7555|Asia/Shanghai
Shaoxing|绍兴|China|中国|30.0303|120.5802|Asia/Shanghai
Jinhua|金华|China|中国|29.0789|119.6474|Asia/Shanghai
Wuhu|芜湖|China|中国|31.3529|118.4330|Asia/Shanghai
Luoyang|洛阳|China|中国|34.6197|112.4540|Asia/Shanghai
Kaifeng|开封|China|中国|34.7971|114.3074|Asia/Shanghai
Yantai|烟台|China|中国|37.4638|121.4479|Asia/Shanghai
Weihai|威海|China|中国|37.5131|122.1204|Asia/Shanghai
Weifang|潍坊|China|中国|36.7069|119.1619|Asia/Shanghai
Linyi|临沂|China|中国|35.1047|118.3564|Asia/Shanghai
Zibo|淄博|China|中国|36.8131|118.0549|Asia/Shanghai
Tangshan|唐山|China|中国|39.6309|118.1802|Asia/Shanghai
Qinhuangdao|秦皇岛|China|中国|39.9354|119.6005|Asia/Shanghai
Baotou|包头|China|中国|40.6574|109.8403|Asia/Shanghai
Datong|大同|China|中国|40.0768|113.3001|Asia/Shanghai
Guilin|桂林|China|中国|25.2736|110.2900|Asia/Shanghai
Liuzhou|柳州|China|中国|24.3264|109.4281|Asia/Shanghai
Beihai|北海|China|中国|21.4813|109.1201|Asia/Shanghai
Lijiang|丽江|China|中国|26.8550|100.2270|Asia/Shanghai
Dali|大理|China|中国|25.6065|100.2676|Asia/Shanghai
Kashgar|喀什|China|中国|39.4704|75.9898|Asia/Urumqi
Yining|伊宁|China|中国|43.9080|81.2777|Asia/Urumqi
Mianyang|绵阳|China|中国|31.4675|104.6796|Asia/Shanghai
Leshan|乐山|China|中国|29.5521|103.7656|Asia/Shanghai
Nanchong|南充|China|中国|30.8378|106.1107|Asia/Shanghai
Zunyi|遵义|China|中国|27.7255|106.9274|Asia/Shanghai
Quanzhou|泉州|China|中国|24.8741|118.6757|Asia/Shanghai
Zhangzhou|漳州|China|中国|24.5130|117.6471|Asia/Shanghai
Putian|莆田|China|中国|25.4541|119.0078|Asia/Shanghai
Zhoushan|舟山|China|中国|30.0160|122.1069|Asia/Shanghai
Huangshan|黄山|China|中国|29.7147|118.3375|Asia/Shanghai
Jingdezhen|景德镇|China|中国|29.2687|117.1784|Asia/Shanghai
Ganzhou|赣州|China|中国|25.8318|114.9336|Asia/Shanghai
Jiujiang|九江|China|中国|29.7051|116.0019|Asia/Shanghai
Yichang|宜昌|China|中国|30.6919|111.2865|Asia/Shanghai
Xiangyang|襄阳|China|中国|32.0090|112.1224|Asia/Shanghai
Yueyang|岳阳|China|中国|29.3571|113.1289|Asia/Shanghai
Zhuzhou|株洲|China|中国|27.8274|113.1339|Asia/Shanghai
Hengyang|衡阳|China|中国|26.8932|112.5720|Asia/Shanghai
Changde|常德|China|中国|29.0314|111.6985|Asia/Shanghai
Anyang|安阳|China|中国|36.0976|114.3924|Asia/Shanghai
Nanyang|南阳|China|中国|32.9908|112.5283|Asia/Shanghai
Jilin|吉林|China|中国|43.8378|126.5496|Asia/Shanghai
Yanji|延吉|China|中国|42.8913|129.5091|Asia/Shanghai
Qiqihar|齐齐哈尔|China|中国|47.3543|123.9182|Asia/Shanghai
Mudanjiang|牡丹江|China|中国|44.5517|129.6332|Asia/Shanghai
Daqing|大庆|China|中国|46.5907|125.1038|Asia/Shanghai
Shantou|汕头|China|中国|23.3540|116.6820|Asia/Shanghai
Huizhou|惠州|China|中国|23.1115|114.4161|Asia/Shanghai
Zhongshan|中山|China|中国|22.5176|113.3928|Asia/Shanghai
Jiangmen|江门|China|中国|22.5789|113.0815|Asia/Shanghai
Zhanjiang|湛江|China|中国|21.2707|110.3594|Asia/Shanghai
Yibin|宜宾|China|中国|28.7518|104.6432|Asia/Shanghai
Luzhou|泸州|China|中国|28.8717|105.4423|Asia/Shanghai
Baoji|宝鸡|China|中国|34.3619|107.2373|Asia/Shanghai
Xianyang|咸阳|China|中国|34.3296|108.7091|Asia/Shanghai
Yan'an|延安|China|中国|36.5853|109.4897|Asia/Shanghai
Dunhuang|敦煌|China|中国|40.1421|94.6618|Asia/Shanghai
Karamay|克拉玛依|China|中国|45.5799|84.8892|Asia/Urumqi
Hotan|和田|China|中国|37.1142|79.9222|Asia/Urumqi
Korla|库尔勒|China|中国|41.7269|86.1746|Asia/Urumqi
Aksu|阿克苏|China|中国|41.1707|80.2606|Asia/Urumqi
Zhangjiajie|张家界|China|中国|29.1171|110.4792|Asia/Shanghai
Qionghai|琼海|China|中国|19.2583|110.4746|Asia/Shanghai
New York|纽约|United States|美国|40.7128|-74.0060|America/New_York
Los Angeles|洛杉矶|United States|美国|34.0522|-118.2437|America/Los_Angeles
Chicago|芝加哥|United States|美国|41.8781|-87.6298|America/Chicago
Houston|休斯顿|United States|美国|29.7604|-95.3698|America/Chicago
Phoenix|凤凰城|United States|美国|33.4484|-112.0740|America/Phoenix
Philadelphia|费城|United States|美国|39.9526|-75.1652|America/New_York
San Antonio|圣安东尼奥|United States|美国|29.4241|-98.4936|America/Chicago
San Diego|圣迭戈|United States|美国|32.7157|-117.1611|America/Los_Angeles
Dallas|达拉斯|United States|美国|32.7767|-96.7970|America/Chicago
San Jose|圣何塞|United States|美国|37.3382|-121.8863|America/Los_Angeles
Austin|奥斯汀|United States|美国|30.2672|-97.7431|America/Chicago
Jacksonville|杰克逊维尔|United States|美国|30.3322|-81.6557|America/New_York
Columbus|哥伦布|United States|美国|39.9612|-82.9988|America/New_York
Charlotte|夏洛特|United States|美国|35.2271|-80.8431|America/New_York
Indianapolis|印第安纳波利斯|United States|美国|39.7684|-86.1581|America/Indiana/Indianapolis
San Francisco|旧金山|United States|美国|37.7749|-122.4194|America/Los_Angeles
Seattle|西雅图|United States|美国|47.6062|-122.3321|America/Los_Angeles
Denver|丹佛|United States|美国|39.7392|-104.9903|America/Denver
Washington|华盛顿|United States|美国|38.9072|-77.0369|America/New_York
Boston|波士顿|United States|美国|42.3601|-71.0589|America/New_York
Nashville|纳什维尔|United States|美国|36.1627|-86.7816|America/Chicago
Detroit|底特律|United States|美国|42.3314|-83.0458|America/Detroit
Portland|波特兰|United States|美国|45.5152|-122.6784|America/Los_Angeles
Las Vegas|拉斯维加斯|United States|美国|36.1699|-115.1398|America/Los_Angeles
Memphis|孟菲斯|United States|美国|35.1495|-90.0490|America/Chicago
Louisville|路易斯维尔|United States|美国|38.2527|-85.7585|America/Kentucky/Louisville
Baltimore|巴尔的摩|United States|美国|39.2904|-76.6122|America/New_York
Milwaukee|密尔沃基|United States|美国|43.0389|-87.9065|America/Chicago
Albuquerque|阿尔伯克基|United States|美国|35.0844|-106.6504|America/Denver
Tucson|图森|United States|美国|32.2226|-110.9747|America/Phoenix
Sacramento|萨克拉门托|United States|美国|38.5816|-121.4944|America/Los_Angeles
Atlanta|亚特兰大|United States|美国|33.7490|-84.3880|America/New_York
Miami|迈阿密|United States|美国|25.7617|-80.1918|America/New_York
Minneapolis|明尼阿波利斯|United States|美国|44.9778|-93.2650|America/Chicago
Cleveland|克利夫兰|United States|美国|41.4993|-81.6944|America/New_York
New Orleans|新奥尔良|United States|美国|29.9511|-90.0715|America/Chicago
Tampa|坦帕|United States|美国|27.9506|-82.4572|America/New_York
Pittsburgh|匹兹堡|United States|美国|40.4406|-79.9959|America/New_York
Cincinnati|辛辛那提|United States|美国|39.1031|-84.5120|America/New_York
Orlando|奥兰多|United States|美国|28.5383|-81.3792|America/New_York
St. Louis|圣路易斯|United States|美国|38.6270|-90.1994|America/Chicago
Salt Lake City|盐湖城|United States|美国|40.7608|-111.8910|America/Denver
Honolulu|檀香山|United States|美国|21.3069|-157.8583|Pacific/Honolulu
Anchorage|安克雷奇|United States|美国|61.2181|-149.9003|America/Anchorage
Buffalo|布法罗|United States|美国|42.8864|-78.8784|America/New_York
Raleigh|罗利|United States|美国|35.7796|-78.6382|America/New_York
Omaha|奥马哈|United States|美国|41.2565|-95.9345|America/Chicago
Kansas City|堪萨斯城|United States|美国|39.0997|-94.5786|America/Chicago
Boise|博伊西|United States|美国|43.6150|-116.2023|America/Boise
Santa Fe|圣菲|United States|美国|35.6870|-105.9378|America/Denver
Juneau|朱诺|United States|美国|58.3019|-134.4197|America/Juneau
Fairbanks|费尔班克斯|United States|美国|64.8378|-147.7164|America/Anchorage
Toronto|多伦多|Canada|加拿大|43.6532|-79.3832|America/Toronto
Vancouver|温哥华|Canada|加拿大|49.2827|-123.1207|America/Vancouver
Montreal|蒙特利尔|Canada|加拿大|45.5017|-73.5673|America/Toronto
Calgary|卡尔加里|Canada|加拿大|51.0447|-114.0719|America/Edmonton
Ottawa|渥太华|Canada|加拿大|45.4215|-75.6972|America/Toronto
Edmonton|埃德蒙顿|Canada|加拿大|53.5461|-113.4938|America/Edmonton
Winnipeg|温尼伯|Canada|加拿大|49.8951|-97.1384|America/Winnipeg
Quebec City|魁北克|Canada|加拿大|46.8139|-71.2080|America/Toronto
Halifax|哈利法克斯|Canada|加拿大|44.6488|-63.5752|America/Halifax
Victoria|维多利亚|Canada|加拿大|48.4284|-123.3656|America/Vancouver
Saskatoon|萨斯卡通|Canada|加拿大|52.1332|-106.6700|America/Regina
St. John's|圣约翰斯|Canada|加拿大|47.5615|-52.7126|America/St_Johns
Whitehorse|白马市|Canada|加拿大|60.7212|-135.0568|America/Whitehorse
Yellowknife|耶洛奈夫|Canada|加拿大|62.4540|-114.3718|America/Yellowknife
Mexico City|墨西哥城|Mexico|墨西哥|19.4326|-99.1332|America/Mexico_City
Guadalajara|瓜达拉哈拉|Mexico|墨西哥|20.6597|-103.3496|America/Mexico_City
Monterrey|蒙特雷|Mexico|墨西哥|25.6866|-100.3161|America/Monterrey
Cancun|坎昆|Mexico|墨西哥|21.1619|-86.8515|America/Cancun
Tijuana|蒂华纳|Mexico|墨西哥|32.5149|-117.0382|America/Tijuana
Havana|哈瓦那|Cuba|古巴|23.1136|-82.3666|America/Havana
Guatemala City|危地马拉城|Guatemala|危地马拉|14.6349|-90.5069|America/Guatemala
San Jose|圣何塞|Costa Rica|哥斯达黎加|9.9281|-84.0907|America/Costa_Rica
Panama City|巴拿马城|Panama|巴拿马|8.9824|-79.5199|America/Panama
Bogota|波哥大|Colombia|哥伦比亚|4.7110|-74.0721|America/Bogota
Lima|利马|Peru|秘鲁|-12.0464|-77.0428|America/Lima
Quito|基多|Ecuador|厄瓜多尔|-0.1807|-78.4678|America/Guayaquil
Caracas|加拉加斯|Venezuela|委内瑞拉|10.4806|-66.9036|America/Caracas
Sao Paulo|圣保罗|Brazil|巴西|-23.5558|-46.6396|America/Sao_Paulo
Rio de Janeiro|里约热内卢|Brazil|巴西|-22.9068|-43.1729|America/Sao_Paulo
Brasilia|巴西利亚|Brazil|巴西|-15.7975|-47.8919|America/Sao_Paulo
Salvador|萨尔瓦多|Brazil|巴西|-12.9777|-38.5016|America/Bahia
Manaus|马瑙斯|Brazil|巴西|-3.1190|-60.0217|America/Manaus
Recife|累西腓|Brazil|巴西|-8.0476|-34.8770|America/Recife
Buenos Aires|布宜诺斯艾利斯|Argentina|阿根廷|-34.6037|-58.3816|America/Argentina/Buenos_Aires
Santiago|圣地亚哥|Chile|智利|-33.4489|-70.6693|America/Santiago
Montevideo|蒙得维的亚|Uruguay|乌拉圭|-34.9011|-56.1645|America/Montevideo
La Paz|拉巴斯|Bolivia|玻利维亚|-16.5000|-68.1500|America/La_Paz
Asuncion|亚松森|Paraguay|巴拉圭|-25.2637|-57.5759|America/Asuncion
Paris|巴黎|France|法国|48.8566|2.3522|Europe/Paris
Lyon|里昂|France|法国|45.7640|4.8357|Europe/Paris
Marseille|马赛|France|法国|43.2965|5.3698|Europe/Paris
Nice|尼斯|France|法国|43.7102|7.2620|Europe/Paris
Berlin|柏林|Germany|德国|52.5200|13.4050|Europe/Berlin
Munich|慕尼黑|Germany|德国|48.1351|11.5820|Europe/Berlin
Hamburg|汉堡|Germany|德国|53.5511|9.9937|Europe/Berlin
Frankfurt|法兰克福|Germany|德国|50.1109|8.6821|Europe/Berlin
Cologne|科隆|Germany|德国|50.9375|6.9603|Europe/Berlin
Madrid|马德里|Spain|西班牙|40.4168|-3.7038|Europe/Madrid
Barcelona|巴塞罗那|Spain|西班牙|41.3874|2.1686|Europe/Madrid
Seville|塞维利亚|Spain|西班牙|37.3891|-5.9845|Europe/Madrid
Valencia|瓦伦西亚|Spain|西班牙|39.4699|-0.3763|Europe/Madrid
Lisbon|里斯本|Portugal|葡萄牙|38.7223|-9.1393|Europe/Lisbon
Porto|波尔图|Portugal|葡萄牙|41.1579|-8.6291|Europe/Lisbon
Rome|罗马|Italy|意大利|41.9028|12.4964|Europe/Rome
Milan|米兰|Italy|意大利|45.4642|9.1900|Europe/Rome
Naples|那不勒斯|Italy|意大利|40.8518|14.2681|Europe/Rome
Florence|佛罗伦萨|Italy|意大利|43.7696|11.2558|Europe/Rome
Venice|威尼斯|Italy|意大利|45.4408|12.3155|Europe/Rome
Turin|都灵|Italy|意大利|45.0703|7.6869|Europe/Rome
Amsterdam|阿姆斯特丹|Netherlands|荷兰|52.3676|4.9041|Europe/Amsterdam
Rotterdam|鹿特丹|Netherlands|荷兰|51.9244|4.4777|Europe/Amsterdam
Brussels|布鲁塞尔|Belgium|比利时|50.8503|4.3517|Europe/Brussels
Antwerp|安特卫普|Belgium|比利时|51.2194|4.4025|Europe/Brussels
Vienna|维也纳|Austria|奥地利|48.2082|16.3738|Europe/Vienna
Zurich|苏黎世|Switzerland|瑞士|47.3769|8.5417|Europe/Zurich
Geneva|日内瓦|Switzerland|瑞士|46.2044|6.1432|Europe/Zurich
Bern|伯尔尼|Switzerland|瑞士|46.9480|7.4474|Europe/Zurich
Stockholm|斯德哥尔摩|Sweden|瑞典|59.3293|18.0686|Europe/Stockholm
Gothenburg|哥德堡|Sweden|瑞典|57.7089|11.9746|Europe/Stockholm
Oslo|奥斯陆|Norway|挪威|59.9139|10.7522|Europe/Oslo
Bergen|卑尔根|Norway|挪威|60.3913|5.3221|Europe/Oslo
Copenhagen|哥本哈根|Denmark|丹麦|55.6761|12.5683|Europe/Copenhagen
Helsinki|赫尔辛基|Finland|芬兰|60.1699|24.9384|Europe/Helsinki
Dublin|都柏林|Ireland|爱尔兰|53.3498|-6.2603|Europe/Dublin
Cork|科克|Ireland|爱尔兰|51.8985|-8.4756|Europe/Dublin
Galway|戈尔韦|Ireland|爱尔兰|53.2707|-9.0568|Europe/Dublin
Reykjavik|雷克雅未克|Iceland|冰岛|64.1466|-21.9426|Atlantic/Reykjavik
Athens|雅典|Greece|希腊|37.9838|23.7275|Europe/Athens
Thessaloniki|塞萨洛尼基|Greece|希腊|40.6401|22.9444|Europe/Athens
Warsaw|华沙|Poland|波兰|52.2297|21.0122|Europe/Warsaw
Krakow|克拉科夫|Poland|波兰|50.0647|19.9450|Europe/Warsaw
Prague|布拉格|Czechia|捷克|50.0755|14.4378|Europe/Prague
Budapest|布达佩斯|Hungary|匈牙利|47.4979|19.0402|Europe/Budapest
Bucharest|布加勒斯特|Romania|罗马尼亚|44.4268|26.1025|Europe/Bucharest
Sofia|索非亚|Bulgaria|保加利亚|42.6977|23.3219|Europe/Sofia
Belgrade|贝尔格莱德|Serbia|塞尔维亚|44.7866|20.4489|Europe/Belgrade
Zagreb|萨格勒布|Croatia|克罗地亚|45.8150|15.9819|Europe/Zagreb
Ljubljana|卢布尔雅那|Slovenia|斯洛文尼亚|46.0569|14.5058|Europe/Ljubljana
Bratislava|布拉迪斯拉发|Slovakia|斯洛伐克|48.1486|17.1077|Europe/Bratislava
Moscow|莫斯科|Russia|俄罗斯|55.7558|37.6173|Europe/Moscow
Saint Petersburg|圣彼得堡|Russia|俄罗斯|59.9311|30.3609|Europe/Moscow
Novosibirsk|新西伯利亚|Russia|俄罗斯|55.0084|82.9357|Asia/Novosibirsk
Vladivostok|符拉迪沃斯托克|Russia|俄罗斯|43.1332|131.9113|Asia/Vladivostok
Yekaterinburg|叶卡捷琳堡|Russia|俄罗斯|56.8389|60.6057|Asia/Yekaterinburg
Kyiv|基辅|Ukraine|乌克兰|50.4501|30.5234|Europe/Kyiv
Istanbul|伊斯坦布尔|Turkey|土耳其|41.0082|28.9784|Europe/Istanbul
Ankara|安卡拉|Turkey|土耳其|39.9334|32.8597|Europe/Istanbul
Tallinn|塔林|Estonia|爱沙尼亚|59.4370|24.7536|Europe/Tallinn
Riga|里加|Latvia|拉脱维亚|56.9496|24.1052|Europe/Riga
Vilnius|维尔纽斯|Lithuania|立陶宛|54.6872|25.2797|Europe/Vilnius
Minsk|明斯克|Belarus|白俄罗斯|53.9006|27.5590|Europe/Minsk
Luxembourg|卢森堡|Luxembourg|卢森堡|49.6116|6.1319|Europe/Luxembourg
Monaco|摩纳哥|Monaco|摩纳哥|43.7384|7.4246|Europe/Monaco
Valletta|瓦莱塔|Malta|马耳他|35.8989|14.5146|Europe/Malta
Nicosia|尼科西亚|Cyprus|塞浦路斯|35.1856|33.3823|Asia/Nicosia
Sarajevo|萨拉热窝|Bosnia and Herzegovina|波黑|43.8563|18.4131|Europe/Sarajevo
Skopje|斯科普里|North Macedonia|北马其顿|41.9981|21.4254|Europe/Skopje
Tirana|地拉那|Albania|阿尔巴尼亚|41.3275|19.8187|Europe/Tirane
Dubai|迪拜|United Arab Emirates|阿联酋|25.2048|55.2708|Asia/Dubai
Abu Dhabi|阿布扎比|United Arab Emirates|阿联酋|24.4539|54.3773|Asia/Dubai
Doha|多哈|Qatar|卡塔尔|25.2854|51.5310|Asia/Qatar
Kuwait City|科威特城|Kuwait|科威特|29.3759|47.9774|Asia/Kuwait
Riyadh|利雅得|Saudi Arabia|沙特阿拉伯|24.7136|46.6753|Asia/Riyadh
Jeddah|吉达|Saudi Arabia|沙特阿拉伯|21.4858|39.1925|Asia/Riyadh
Mecca|麦加|Saudi Arabia|沙特阿拉伯|21.3891|39.8579|Asia/Riyadh
Muscat|马斯喀特|Oman|阿曼|23.5880|58.3829|Asia/Muscat
Manama|麦纳麦|Bahrain|巴林|26.2235|50.5876|Asia/Bahrain
Tehran|德黑兰|Iran|伊朗|35.6892|51.3890|Asia/Tehran
Baghdad|巴格达|Iraq|伊拉克|33.3152|44.3661|Asia/Baghdad
Jerusalem|耶路撒冷|Israel|以色列|31.7683|35.2137|Asia/Jerusalem
Tel Aviv|特拉维夫|Israel|以色列|32.0853|34.7818|Asia/Jerusalem
Amman|安曼|Jordan|约旦|31.9454|35.9284|Asia/Amman
Beirut|贝鲁特|Lebanon|黎巴嫩|33.8938|35.5018|Asia/Beirut
Damascus|大马士革|Syria|叙利亚|33.5138|36.2765|Asia/Damascus
Cairo|开罗|Egypt|埃及|30.0444|31.2357|Africa/Cairo
Alexandria|亚历山大|Egypt|埃及|31.2001|29.9187|Africa/Cairo
Casablanca|卡萨布兰卡|Morocco|摩洛哥|33.5731|-7.5898|Africa/Casablanca
Marrakesh|马拉喀什|Morocco|摩洛哥|31.6295|-7.9811|Africa/Casablanca
Tunis|突尼斯|Tunisia|突尼斯|36.8065|10.1815|Africa/Tunis
Algiers|阿尔及尔|Algeria|阿尔及利亚|36.7538|3.0588|Africa/Algiers
Tripoli|的黎波里|Libya|利比亚|32.8872|13.1913|Africa/Tripoli
Lagos|拉各斯|Nigeria|尼日利亚|6.5244|3.3792|Africa/Lagos
Abuja|阿布贾|Nigeria|尼日利亚|9.0765|7.3986|Africa/Lagos
Accra|阿克拉|Ghana|加纳|5.6037|-0.1870|Africa/Accra
Nairobi|内罗毕|Kenya|肯尼亚|-1.2921|36.8219|Africa/Nairobi
Addis Ababa|亚的斯亚贝巴|Ethiopia|埃塞俄比亚|9.0320|38.7469|Africa/Addis_Ababa
Johannesburg|约翰内斯堡|South Africa|南非|-26.2041|28.0473|Africa/Johannesburg
Cape Town|开普敦|South Africa|南非|-33.9249|18.4241|Africa/Johannesburg
Durban|德班|South Africa|南非|-29.8587|31.0218|Africa/Johannesburg
Dar es Salaam|达累斯萨拉姆|Tanzania|坦桑尼亚|-6.7924|39.2083|Africa/Dar_es_Salaam
Kampala|坎帕拉|Uganda|乌干达|0.3476|32.5825|Africa/Kampala
Kigali|基加利|Rwanda|卢旺达|-1.9441|30.0619|Africa/Kigali
Dakar|达喀尔|Senegal|塞内加尔|14.7167|-17.4677|Africa/Dakar
Abidjan|阿比让|Cote d'Ivoire|科特迪瓦|5.3600|-4.0083|Africa/Abidjan
Kinshasa|金沙萨|DR Congo|刚果民主共和国|-4.4419|15.2663|Africa/Kinshasa
Luanda|罗安达|Angola|安哥拉|-8.8390|13.2894|Africa/Luanda
Maputo|马普托|Mozambique|莫桑比克|-25.9692|32.5732|Africa/Maputo
Harare|哈拉雷|Zimbabwe|津巴布韦|-17.8252|31.0335|Africa/Harare
Lusaka|卢萨卡|Zambia|赞比亚|-15.3875|28.3228|Africa/Lusaka
Antananarivo|安塔那那利佛|Madagascar|马达加斯加|-18.8792|47.5079|Indian/Antananarivo
Port Louis|路易港|Mauritius|毛里求斯|-20.1609|57.5012|Indian/Mauritius
Mumbai|孟买|India|印度|19.0760|72.8777|Asia/Kolkata
Delhi|德里|India|印度|28.7041|77.1025|Asia/Kolkata
Bengaluru|班加罗尔|India|印度|12.9716|77.5946|Asia/Kolkata
Kolkata|加尔各答|India|印度|22.5726|88.3639|Asia/Kolkata
Chennai|金奈|India|印度|13.0827|80.2707|Asia/Kolkata
Hyderabad|海德拉巴|India|印度|17.3850|78.4867|Asia/Kolkata
Ahmedabad|艾哈迈达巴德|India|印度|23.0225|72.5714|Asia/Kolkata
Pune|浦那|India|印度|18.5204|73.8567|Asia/Kolkata
Jaipur|斋浦尔|India|印度|26.9124|75.7873|Asia/Kolkata
Kochi|科钦|India|印度|9.9312|76.2673|Asia/Kolkata
Kathmandu|加德满都|Nepal|尼泊尔|27.7172|85.3240|Asia/Kathmandu
Colombo|科伦坡|Sri Lanka|斯里兰卡|6.9271|79.8612|Asia/Colombo
Dhaka|达卡|Bangladesh|孟加拉国|23.8103|90.4125|Asia/Dhaka
Karachi|卡拉奇|Pakistan|巴基斯坦|24.8607|67.0011|Asia/Karachi
Lahore|拉合尔|Pakistan|巴基斯坦|31.5204|74.3587|Asia/Karachi
Islamabad|伊斯兰堡|Pakistan|巴基斯坦|33.6844|73.0479|Asia/Karachi
Kabul|喀布尔|Afghanistan|阿富汗|34.5553|69.2075|Asia/Kabul
Tashkent|塔什干|Uzbekistan|乌兹别克斯坦|41.2995|69.2401|Asia/Tashkent
Almaty|阿拉木图|Kazakhstan|哈萨克斯坦|43.2220|76.8512|Asia/Almaty
Astana|阿斯塔纳|Kazakhstan|哈萨克斯坦|51.1694|71.4491|Asia/Almaty
Bishkek|比什凯克|Kyrgyzstan|吉尔吉斯斯坦|42.8746|74.5698|Asia/Bishkek
Dushanbe|杜尚别|Tajikistan|塔吉克斯坦|38.5598|68.7740|Asia/Dushanbe
Tbilisi|第比利斯|Georgia|格鲁吉亚|41.7151|44.8271|Asia/Tbilisi
Yerevan|埃里温|Armenia|亚美尼亚|40.1792|44.4991|Asia/Yerevan
Baku|巴库|Azerbaijan|阿塞拜疆|40.4093|49.8671|Asia/Baku
Bangkok|曼谷|Thailand|泰国|13.7563|100.5018|Asia/Bangkok
Chiang Mai|清迈|Thailand|泰国|18.7883|98.9853|Asia/Bangkok
Singapore|新加坡|Singapore|新加坡|1.3521|103.8198|Asia/Singapore
Kuala Lumpur|吉隆坡|Malaysia|马来西亚|3.1390|101.6869|Asia/Kuala_Lumpur
Penang|槟城|Malaysia|马来西亚|5.4141|100.3288|Asia/Kuala_Lumpur
Jakarta|雅加达|Indonesia|印度尼西亚|-6.2088|106.8456|Asia/Jakarta
Denpasar|登巴萨|Indonesia|印度尼西亚|-8.6705|115.2126|Asia/Makassar
Surabaya|泗水|Indonesia|印度尼西亚|-7.2575|112.7521|Asia/Jakarta
Manila|马尼拉|Philippines|菲律宾|14.5995|120.9842|Asia/Manila
Cebu|宿务|Philippines|菲律宾|10.3157|123.8854|Asia/Manila
Hanoi|河内|Vietnam|越南|21.0278|105.8342|Asia/Ho_Chi_Minh
Ho Chi Minh City|胡志明市|Vietnam|越南|10.8231|106.6297|Asia/Ho_Chi_Minh
Phnom Penh|金边|Cambodia|柬埔寨|11.5564|104.9282|Asia/Phnom_Penh
Vientiane|万象|Laos|老挝|17.9757|102.6331|Asia/Vientiane
Yangon|仰光|Myanmar|缅甸|16.8409|96.1735|Asia/Yangon
Seoul|首尔|South Korea|韩国|37.5665|126.9780|Asia/Seoul
Busan|釜山|South Korea|韩国|35.1796|129.0756|Asia/Seoul
Tokyo|东京|Japan|日本|35.6762|139.6503|Asia/Tokyo
Osaka|大阪|Japan|日本|34.6937|135.5023|Asia/Tokyo
Kyoto|京都|Japan|日本|35.0116|135.7681|Asia/Tokyo
Sapporo|札幌|Japan|日本|43.0618|141.3545|Asia/Tokyo
Fukuoka|福冈|Japan|日本|33.5904|130.4017|Asia/Tokyo
Nagoya|名古屋|Japan|日本|35.1815|136.9066|Asia/Tokyo
Hiroshima|广岛|Japan|日本|34.3853|132.4553|Asia/Tokyo
Pyongyang|平壤|North Korea|朝鲜|39.0392|125.7625|Asia/Pyongyang
Ulaanbaatar|乌兰巴托|Mongolia|蒙古|47.8864|106.9057|Asia/Ulaanbaatar
Sydney|悉尼|Australia|澳大利亚|-33.8688|151.2093|Australia/Sydney
Melbourne|墨尔本|Australia|澳大利亚|-37.8136|144.9631|Australia/Melbourne
Brisbane|布里斯班|Australia|澳大利亚|-27.4698|153.0251|Australia/Brisbane
Perth|珀斯|Australia|澳大利亚|-31.9523|115.8613|Australia/Perth
Adelaide|阿德莱德|Australia|澳大利亚|-34.9285|138.6007|Australia/Adelaide
Darwin|达尔文|Australia|澳大利亚|-12.4634|130.8456|Australia/Darwin
Hobart|霍巴特|Australia|澳大利亚|-42.8821|147.3272|Australia/Hobart
Canberra|堪培拉|Australia|澳大利亚|-35.2809|149.1300|Australia/Sydney
Auckland|奥克兰|New Zealand|新西兰|-36.8509|174.7645|Pacific/Auckland
Wellington|惠灵顿|New Zealand|新西兰|-41.2865|174.7762|Pacific/Auckland
Christchurch|克赖斯特彻奇|New Zealand|新西兰|-43.5321|172.6362|Pacific/Auckland
Suva|苏瓦|Fiji|斐济|-18.1416|178.4419|Pacific/Fiji
Port Moresby|莫尔兹比港|Papua New Guinea|巴布亚新几内亚|-9.4438|147.1803|Pacific/Port_Moresby
Papeete|帕皮提|French Polynesia|法属波利尼西亚|-17.5516|-149.5585|Pacific/Tahiti
Noumea|努美阿|New Caledonia|新喀里多尼亚|-22.2735|166.4481|Pacific/Noumea
Apia|阿皮亚|Samoa|萨摩亚|-13.8506|-171.7513|Pacific/Apia
`;

function parse(line) {
  const [name, nameZh, country, countryZh, lat, lon, tz] = line.split('|');
  const id = `${name}|${country}`;
  return { id, name, nameZh, country, countryZh, lat: Number(lat), lon: Number(lon), tz };
}

export const cities = RAW.trim().split('\n').filter(Boolean).map(parse);

const byId = new Map(cities.map((city) => [city.id, city]));

export function cityLabel(city, language = 'en') {
  if (!city) return '';
  return language === 'zh' ? `${city.nameZh} · ${city.countryZh}` : `${city.name}, ${city.country}`;
}

function fold(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function searchCities(query, limit = 8) {
  const needle = fold(query);
  if (!needle) return [];
  const scored = [];
  for (const city of cities) {
    const name = fold(city.name);
    const zh = city.nameZh;
    const country = fold(city.country);
    const countryZh = city.countryZh;
    let score = 0;
    if (name === needle || zh === query.trim()) score = 100;
    else if (name.startsWith(needle) || zh.startsWith(query.trim())) score = 80;
    else if (name.includes(needle) || zh.includes(query.trim()) || country.includes(needle) || countryZh.includes(query.trim())) score = 40;
    else if (`${name}, ${country}`.includes(needle)) score = 30;
    if (score) scored.push({ city, score });
  }
  scored.sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name));
  return scored.slice(0, limit).map((item) => item.city);
}

/** Exact city, Chinese name, or "Name, Country". Null when missing or ambiguous. */
export function findCity(query) {
  const raw = String(query || '').trim();
  if (!raw) return null;
  const needle = fold(raw);
  const exact = cities.filter((city) => fold(city.name) === needle || city.nameZh === raw || fold(cityLabel(city)) === needle || cityLabel(city, 'zh') === raw);
  if (exact.length === 1) return exact[0];
  return null;
}

export function getCity(id) {
  return byId.get(id) || null;
}
