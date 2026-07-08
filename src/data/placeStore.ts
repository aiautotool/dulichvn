import * as SQLite from 'expo-sqlite';
import { wikimediaPlaces, type WikimediaPlaceSeed } from './wikimediaPlaces';

export type PlaceImageKey =
  | 'benThanhMarket'
  | 'caiRangFloatingMarket'
  | 'haLongBay'
  | 'hoanKiemLake'
  | 'hoiAnAncientTown'
  | 'hueImperialCity'
  | 'myKheBeach'
  | 'phongNhaCave'
  | 'phuQuocBeach';

export type StoredTravelPlace = {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string;
  history: string;
  bestTime: string;
  ticketPrice: string;
  openHours: string;
  lat: number;
  lng: number;
  tags: string[];
  whyGo: string;
  travelTip: string;
  imageKey: PlaceImageKey;
  imageUrl?: string;
  wikipediaUrl?: string;
  sourceUrl?: string;
  source?: string;
  sortOrder: number;
  isFeatured: number;
};

type TravelPlaceRow = Omit<
  StoredTravelPlace,
  'tags' | 'imageUrl' | 'wikipediaUrl' | 'sourceUrl' | 'source'
> & {
  tagsJson: string;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  sourceUrl: string | null;
  source: string | null;
};

const DATABASE_NAME = 'vinago-plus-travel.db';
const DATABASE_VERSION = 4;
const OPEN_DATA_SORT_OFFSET = 10000;

const curatedTravelPlaceSeeds: StoredTravelPlace[] = [
  {
    id: 'ha_long_bay',
    name: 'Vịnh Hạ Long',
    city: 'Hạ Long',
    category: 'Vịnh biển',
    description:
      'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi, hang động và các tuyến du thuyền qua đêm.',
    history:
      'Vịnh Hạ Long được UNESCO công nhận là Di sản Thiên nhiên Thế giới và là biểu tượng du lịch của miền Bắc.',
    bestTime: 'Tháng 3 - 5 hoặc 9 - 11',
    ticketPrice: 'Vé tham quan và tàu tùy tuyến',
    openHours: 'Theo lịch tàu',
    lat: 20.91,
    lng: 107.183,
    tags: ['UNESCO', 'Du thuyền', 'Hang động'],
    whyGo: 'Cảnh quan biển đá vôi đặc trưng nhất Việt Nam, hợp cho cả chuyến đi trong ngày và nghỉ đêm.',
    travelTip: 'Đặt tàu sớm, chọn tuyến Lan Hạ nếu muốn không gian yên tĩnh hơn.',
    imageKey: 'haLongBay',
    sortOrder: 10,
    isFeatured: 1,
  },
  {
    id: 'pho_co_hanoi',
    name: 'Phố cổ Hà Nội',
    city: 'Hà Nội',
    category: 'Khu phố',
    description:
      'Mạng lưới phố nghề, quán ăn lâu đời, cà phê nhỏ và nhịp sống vỉa hè dày đặc quanh Hồ Gươm.',
    history: 'Khu phố cổ hình thành từ các phường nghề truyền thống, gắn với lịch sử Thăng Long.',
    bestTime: 'Sáng sớm hoặc tối cuối tuần',
    ticketPrice: 'Miễn phí',
    openHours: 'Cả ngày',
    lat: 21.035,
    lng: 105.852,
    tags: ['Ẩm thực', 'Đi bộ', 'Lịch sử'],
    whyGo: 'Đây là nơi dễ cảm nhận nhất nhịp sống Hà Nội qua ẩm thực, kiến trúc và phố nghề.',
    travelTip: 'Lấy Hồ Gươm làm mốc, đi bộ từng cụm phố thay vì cố xem hết một lượt.',
    imageKey: 'hoanKiemLake',
    sortOrder: 20,
    isFeatured: 1,
  },
  {
    id: 'hoan_kiem_lake',
    name: 'Hồ Hoàn Kiếm',
    city: 'Hà Nội',
    category: 'Hồ đô thị',
    description:
      'Không gian trung tâm của Hà Nội với Tháp Rùa, đền Ngọc Sơn và phố đi bộ quanh hồ.',
    history: 'Gắn với truyền thuyết vua Lê Lợi trả gươm thần, là biểu tượng văn hóa của thủ đô.',
    bestTime: 'Sáng sớm hoặc chiều tối',
    ticketPrice: 'Miễn phí, vé đền Ngọc Sơn riêng',
    openHours: 'Cả ngày',
    lat: 21.028,
    lng: 105.852,
    tags: ['Biểu tượng', 'Đi bộ', 'Cà phê'],
    whyGo: 'Một điểm mở đầu nhẹ nhàng để định vị khu trung tâm Hà Nội.',
    travelTip: 'Đi một vòng hồ rồi ghé cà phê trứng hoặc kem Tràng Tiền gần đó.',
    imageKey: 'hoanKiemLake',
    sortOrder: 30,
    isFeatured: 0,
  },
  {
    id: 'van_mieu',
    name: 'Văn Miếu - Quốc Tử Giám',
    city: 'Hà Nội',
    category: 'Di tích',
    description:
      'Quần thể kiến trúc Nho học yên tĩnh với hồ nước, bia tiến sĩ và nhiều lớp sân cổ.',
    history:
      'Được xem là trường đại học đầu tiên của Việt Nam, gắn với truyền thống khoa bảng Thăng Long.',
    bestTime: 'Sáng trong tuần',
    ticketPrice: 'Vé tham quan theo quy định',
    openHours: 'Ban ngày',
    lat: 21.0287,
    lng: 105.8356,
    tags: ['Giáo dục', 'Kiến trúc', 'Di tích'],
    whyGo: 'Không gian cô đọng để hiểu về truyền thống học tập và kiến trúc cổ Hà Nội.',
    travelTip: 'Đi chậm qua từng sân, tránh giờ đoàn học sinh nếu muốn chụp ảnh yên tĩnh.',
    imageKey: 'hoanKiemLake',
    sortOrder: 40,
    isFeatured: 0,
  },
  {
    id: 'ho_tay',
    name: 'Hồ Tây',
    city: 'Hà Nội',
    category: 'Hồ đô thị',
    description:
      'Vùng hồ lớn phía tây thành phố với chùa Trấn Quốc, đường ven hồ, cà phê và cảnh hoàng hôn.',
    history:
      'Hồ Tây gắn với nhiều làng cổ, đền chùa và không gian nghỉ ngơi lâu đời của người Hà Nội.',
    bestTime: 'Chiều muộn',
    ticketPrice: 'Miễn phí',
    openHours: 'Cả ngày',
    lat: 21.0545,
    lng: 105.8189,
    tags: ['Hoàng hôn', 'Cà phê', 'Chùa'],
    whyGo: 'Một nhịp Hà Nội rộng rãi hơn, hợp để nghỉ sau khu phố cổ đông đúc.',
    travelTip: 'Chọn một đoạn ven hồ ngắn để đi bộ, không nên cố đi hết vòng hồ nếu ít thời gian.',
    imageKey: 'hoanKiemLake',
    sortOrder: 50,
    isFeatured: 0,
  },
  {
    id: 'ninh_binh',
    name: 'Tràng An',
    city: 'Ninh Bình',
    category: 'Di sản',
    description:
      'Quần thể sông núi đá vôi, hang xuyên thủy và đền cổ, thường được gọi là Hạ Long trên cạn.',
    history:
      'Nằm trong Quần thể danh thắng Tràng An, Di sản Văn hóa và Thiên nhiên Thế giới của UNESCO.',
    bestTime: 'Tháng 3 - 5 hoặc mùa lúa',
    ticketPrice: 'Vé đò và tham quan theo tuyến',
    openHours: 'Ban ngày',
    lat: 20.2506,
    lng: 105.919,
    tags: ['UNESCO', 'Đò', 'Núi đá vôi'],
    whyGo: 'Một trong những trải nghiệm sông núi đẹp nhất miền Bắc, phù hợp đi trong ngày từ Hà Nội.',
    travelTip: 'Mang mũ, nước và chọn tuyến đò theo sức bền vì thời gian ngồi thuyền khá lâu.',
    imageKey: 'haLongBay',
    sortOrder: 60,
    isFeatured: 1,
  },
  {
    id: 'tam_coc',
    name: 'Tam Cốc',
    city: 'Ninh Bình',
    category: 'Sông nước',
    description:
      'Tuyến đò đi giữa ruộng lúa, núi đá vôi và các hang nước thấp trong khu vực Hoa Lư.',
    history:
      'Tam Cốc thuộc vùng cảnh quan gắn với cố đô Hoa Lư và đời sống nông nghiệp đồng bằng Bắc Bộ.',
    bestTime: 'Mùa lúa chín tháng 5 - 6',
    ticketPrice: 'Vé đò và vé thắng cảnh',
    openHours: 'Ban ngày',
    lat: 20.215,
    lng: 105.936,
    tags: ['Ruộng lúa', 'Đò', 'Hang nước'],
    whyGo: 'Cảnh ruộng lúa sát chân núi rất khác Tràng An, đẹp nhất khi lúa vào mùa.',
    travelTip: 'Đi sáng sớm để tránh nắng và hỏi rõ giá trước khi dùng thêm dịch vụ chụp ảnh.',
    imageKey: 'haLongBay',
    sortOrder: 70,
    isFeatured: 0,
  },
  {
    id: 'sapa',
    name: 'Sa Pa',
    city: 'Sa Pa',
    category: 'Thị trấn núi',
    description:
      'Thị trấn cao nguyên với khí hậu mát, ruộng bậc thang, trekking bản làng và chợ vùng cao.',
    history:
      'Sa Pa phát triển như điểm nghỉ dưỡng vùng núi thời Pháp và là cửa ngõ văn hóa Tây Bắc.',
    bestTime: 'Tháng 9 - 10 hoặc mùa xuân',
    ticketPrice: 'Tùy điểm tham quan và tour trekking',
    openHours: 'Cả ngày',
    lat: 22.337,
    lng: 103.844,
    tags: ['Trekking', 'Ruộng bậc thang', 'Tây Bắc'],
    whyGo: 'Cảnh ruộng bậc thang và văn hóa bản địa giúp hành trình miền Bắc có chiều sâu hơn.',
    travelTip: 'Mang áo ấm và giày bám tốt; thời tiết đổi nhanh trong ngày.',
    imageKey: 'hoanKiemLake',
    sortOrder: 80,
    isFeatured: 1,
  },
  {
    id: 'fansipan',
    name: 'Fansipan',
    city: 'Sa Pa',
    category: 'Đỉnh núi',
    description:
      'Đỉnh cao nhất Việt Nam, nay có tuyến cáp treo, quần thể tâm linh và góc nhìn rộng xuống Hoàng Liên Sơn.',
    history:
      'Fansipan được gọi là nóc nhà Đông Dương, trước đây là cung trekking nhiều ngày nổi tiếng.',
    bestTime: 'Ngày trời quang',
    ticketPrice: 'Vé cáp treo và tàu leo núi',
    openHours: 'Theo lịch vận hành',
    lat: 22.3033,
    lng: 103.7755,
    tags: ['Cáp treo', 'Núi', 'Viewpoint'],
    whyGo: 'Trải nghiệm độ cao ấn tượng mà không cần trekking dài ngày.',
    travelTip: 'Kiểm tra mây và gió trước khi mua vé; trên đỉnh thường lạnh hơn thị trấn nhiều.',
    imageKey: 'hoanKiemLake',
    sortOrder: 90,
    isFeatured: 0,
  },
  {
    id: 'hoi_an',
    name: 'Phố cổ Hội An',
    city: 'Hội An',
    category: 'Di sản',
    description:
      'Phố cổ ven sông với nhà cổ, hội quán, đèn lồng, thuyền nhỏ và ẩm thực miền Trung.',
    history:
      'Hội An từng là thương cảng quốc tế từ thế kỷ 16 - 17, hiện là Di sản Văn hóa Thế giới.',
    bestTime: 'Chiều tối',
    ticketPrice: 'Vé tham quan khu phố cổ theo quy định',
    openHours: 'Cả ngày',
    lat: 15.8801,
    lng: 108.338,
    tags: ['UNESCO', 'Đèn lồng', 'Ẩm thực'],
    whyGo: 'Một trong những phố cổ dễ đi bộ và giàu không khí nhất Việt Nam.',
    travelTip: 'Đi sớm hơn giờ cao điểm tối để xem phố khi còn ánh sáng và ít đông.',
    imageKey: 'hoiAnAncientTown',
    sortOrder: 100,
    isFeatured: 1,
  },
  {
    id: 'my_son',
    name: 'Thánh địa Mỹ Sơn',
    city: 'Hội An',
    category: 'Di tích Chăm',
    description:
      'Quần thể đền tháp Chăm nằm trong thung lũng xanh, phù hợp đi nửa ngày từ Hội An hoặc Đà Nẵng.',
    history:
      'Mỹ Sơn là trung tâm tôn giáo quan trọng của vương quốc Chăm Pa và được UNESCO công nhận.',
    bestTime: 'Sáng sớm',
    ticketPrice: 'Vé tham quan theo quy định',
    openHours: 'Ban ngày',
    lat: 15.765,
    lng: 108.122,
    tags: ['UNESCO', 'Chăm Pa', 'Khảo cổ'],
    whyGo: 'Bổ sung chiều sâu lịch sử miền Trung ngoài trải nghiệm phố cổ.',
    travelTip: 'Mang nước và chống nắng; khu di tích ít bóng râm ở nhiều đoạn.',
    imageKey: 'hoiAnAncientTown',
    sortOrder: 110,
    isFeatured: 0,
  },
  {
    id: 'da_nang',
    name: 'Biển Mỹ Khê',
    city: 'Đà Nẵng',
    category: 'Bãi biển',
    description:
      'Bãi biển dài, sạch, dễ tiếp cận ngay trong thành phố, hợp tắm biển, đi bộ và ngắm bình minh.',
    history:
      'Mỹ Khê là một trong các bãi biển đô thị nổi tiếng nhất miền Trung, gắn với sự phát triển du lịch Đà Nẵng.',
    bestTime: 'Sáng sớm hoặc chiều mát',
    ticketPrice: 'Miễn phí',
    openHours: 'Cả ngày',
    lat: 16.054,
    lng: 108.247,
    tags: ['Biển', 'Bình minh', 'Đô thị'],
    whyGo: 'Điểm nghỉ nhịp tốt giữa hành trình Hội An, Huế và các điểm núi quanh Đà Nẵng.',
    travelTip: 'Tránh tắm khi có cờ cảnh báo và đi sáng sớm nếu muốn ảnh ít người.',
    imageKey: 'myKheBeach',
    sortOrder: 120,
    isFeatured: 1,
  },
  {
    id: 'ba_na_hills',
    name: 'Bà Nà Hills',
    city: 'Đà Nẵng',
    category: 'Khu du lịch',
    description:
      'Khu du lịch trên núi với cáp treo dài, Cầu Vàng, làng Pháp và khí hậu mát hơn thành phố.',
    history:
      'Bà Nà từng là khu nghỉ dưỡng thời Pháp, nay trở thành tổ hợp vui chơi nổi bật của miền Trung.',
    bestTime: 'Sáng sớm',
    ticketPrice: 'Vé cáp treo và khu vui chơi',
    openHours: 'Theo lịch khu du lịch',
    lat: 15.997,
    lng: 107.987,
    tags: ['Cầu Vàng', 'Cáp treo', 'Núi'],
    whyGo: 'Một điểm vui chơi dễ đi trong ngày, đặc biệt với gia đình hoặc nhóm đông.',
    travelTip: 'Mua vé trước và đi cáp treo sớm để tránh hàng dài ở Cầu Vàng.',
    imageKey: 'myKheBeach',
    sortOrder: 130,
    isFeatured: 1,
  },
  {
    id: 'marble_mountains',
    name: 'Ngũ Hành Sơn',
    city: 'Đà Nẵng',
    category: 'Núi đá',
    description:
      'Cụm núi đá vôi có hang động, chùa, lối leo bộ và điểm nhìn ra thành phố biển.',
    history:
      'Ngũ Hành Sơn gắn với tín ngưỡng Phật giáo, làng đá Non Nước và tuyến đường di sản miền Trung.',
    bestTime: 'Sáng hoặc chiều mát',
    ticketPrice: 'Vé tham quan và thang máy tùy chọn',
    openHours: 'Ban ngày',
    lat: 16.0037,
    lng: 108.264,
    tags: ['Hang động', 'Chùa', 'Viewpoint'],
    whyGo: 'Một điểm nửa ngày cân bằng giữa thiên nhiên, tín ngưỡng và vận động nhẹ.',
    travelTip: 'Mang giày chắc chân vì nhiều bậc đá trơn khi trời mưa.',
    imageKey: 'myKheBeach',
    sortOrder: 140,
    isFeatured: 0,
  },
  {
    id: 'hue',
    name: 'Đại Nội Huế',
    city: 'Huế',
    category: 'Hoàng thành',
    description:
      'Quần thể cung điện, cổng thành, điện thờ và sân rộng của triều Nguyễn bên bờ sông Hương.',
    history:
      'Huế là kinh đô triều Nguyễn từ năm 1802 đến 1945 và là Di sản Văn hóa Thế giới.',
    bestTime: 'Sáng sớm',
    ticketPrice: 'Vé tham quan theo tuyến',
    openHours: 'Ban ngày',
    lat: 16.469,
    lng: 107.578,
    tags: ['UNESCO', 'Hoàng gia', 'Lịch sử'],
    whyGo: 'Điểm cốt lõi để hiểu về Việt Nam thời Nguyễn và bản sắc cố đô.',
    travelTip: 'Nên thuê hướng dẫn viên hoặc audio guide vì khuôn viên rất rộng.',
    imageKey: 'hueImperialCity',
    sortOrder: 150,
    isFeatured: 1,
  },
  {
    id: 'thien_mu_pagoda',
    name: 'Chùa Thiên Mụ',
    city: 'Huế',
    category: 'Chùa',
    description:
      'Ngôi chùa biểu tượng bên sông Hương với tháp Phước Duyên và không gian nhìn ra bến thuyền.',
    history:
      'Chùa Thiên Mụ hình thành từ đầu thế kỷ 17, gắn với lịch sử Phật giáo và cố đô Huế.',
    bestTime: 'Chiều mát',
    ticketPrice: 'Miễn phí',
    openHours: 'Ban ngày',
    lat: 16.4536,
    lng: 107.5444,
    tags: ['Chùa', 'Sông Hương', 'Biểu tượng'],
    whyGo: 'Một điểm ngắn nhưng rất Huế, hợp kết hợp với thuyền sông Hương.',
    travelTip: 'Giữ trang phục lịch sự và nói nhỏ trong khuôn viên chùa.',
    imageKey: 'hueImperialCity',
    sortOrder: 160,
    isFeatured: 0,
  },
  {
    id: 'phong_nha',
    name: 'Phong Nha - Kẻ Bàng',
    city: 'Quảng Bình',
    category: 'Vườn quốc gia',
    description:
      'Vườn quốc gia với hệ thống hang động, sông ngầm, rừng đá vôi và nhiều tour mạo hiểm.',
    history:
      'Phong Nha - Kẻ Bàng là Di sản Thiên nhiên Thế giới, nổi tiếng với địa chất karst cổ.',
    bestTime: 'Tháng 3 - 8',
    ticketPrice: 'Tùy hang và tour',
    openHours: 'Theo từng điểm tham quan',
    lat: 17.591,
    lng: 106.283,
    tags: ['UNESCO', 'Hang động', 'Thiên nhiên'],
    whyGo: 'Thiên đường hang động của Việt Nam, từ tuyến nhẹ đến các tour thám hiểm dài ngày.',
    travelTip: 'Đặt tour sớm vào mùa cao điểm và kiểm tra thời tiết vì mưa ảnh hưởng hang nước.',
    imageKey: 'phongNhaCave',
    sortOrder: 170,
    isFeatured: 1,
  },
  {
    id: 'paradise_cave',
    name: 'Động Thiên Đường',
    city: 'Quảng Bình',
    category: 'Hang động',
    description:
      'Hang khô dài với lối đi gỗ, trần cao và các khối thạch nhũ lớn trong vùng Phong Nha.',
    history:
      'Động Thiên Đường được khai thác du lịch như một trong những hang khô ấn tượng nhất Quảng Bình.',
    bestTime: 'Mùa khô',
    ticketPrice: 'Vé tham quan theo quy định',
    openHours: 'Ban ngày',
    lat: 17.519,
    lng: 106.225,
    tags: ['Thạch nhũ', 'Hang khô', 'Gia đình'],
    whyGo: 'Dễ tiếp cận hơn các tour mạo hiểm nhưng vẫn cho cảm giác hang động rất hoành tráng.',
    travelTip: 'Chuẩn bị đi bộ lên dốc một đoạn trước cửa hang.',
    imageKey: 'phongNhaCave',
    sortOrder: 180,
    isFeatured: 0,
  },
  {
    id: 'nha_trang',
    name: 'Biển Nha Trang',
    city: 'Nha Trang',
    category: 'Bãi biển',
    description:
      'Dải biển đô thị dài, gần khách sạn, nhà hàng, bến tàu và các tour đảo trong vịnh.',
    history:
      'Nha Trang từng là vùng đất Chăm Pa và nay là trung tâm du lịch biển lớn của Nam Trung Bộ.',
    bestTime: 'Tháng 2 - 9',
    ticketPrice: 'Miễn phí, tour đảo tính riêng',
    openHours: 'Cả ngày',
    lat: 12.238,
    lng: 109.196,
    tags: ['Biển', 'Đảo', 'Lặn biển'],
    whyGo: 'Dễ kết hợp nghỉ dưỡng, ăn hải sản và đi đảo trong một lịch trình ngắn.',
    travelTip: 'Đi đảo sớm và kiểm tra điều kiện biển nếu muốn lặn ngắm san hô.',
    imageKey: 'myKheBeach',
    sortOrder: 190,
    isFeatured: 0,
  },
  {
    id: 'po_nagar',
    name: 'Tháp Bà Ponagar',
    city: 'Nha Trang',
    category: 'Di tích Chăm',
    description:
      'Quần thể tháp Chăm trên đồi thấp, nhìn xuống sông Cái và thành phố biển Nha Trang.',
    history:
      'Ponagar là di tích Chăm Pa quan trọng, phản ánh lớp văn hóa lâu đời trước đô thị biển hiện đại.',
    bestTime: 'Sáng hoặc chiều mát',
    ticketPrice: 'Vé tham quan theo quy định',
    openHours: 'Ban ngày',
    lat: 12.2654,
    lng: 109.1953,
    tags: ['Chăm Pa', 'Di tích', 'Viewpoint'],
    whyGo: 'Một điểm lịch sử ngắn gọn nhưng giúp Nha Trang không chỉ là biển.',
    travelTip: 'Mặc đồ lịch sự vì đây vẫn là nơi sinh hoạt tín ngưỡng.',
    imageKey: 'myKheBeach',
    sortOrder: 200,
    isFeatured: 0,
  },
  {
    id: 'da_lat',
    name: 'Đà Lạt',
    city: 'Đà Lạt',
    category: 'Cao nguyên',
    description:
      'Thành phố khí hậu mát với hồ, rừng thông, biệt thự Pháp, vườn hoa và nhiều quán cà phê.',
    history:
      'Đà Lạt được quy hoạch như đô thị nghỉ dưỡng từ thời Pháp, nay là điểm tránh nóng nổi tiếng.',
    bestTime: 'Mùa khô tháng 12 - 3',
    ticketPrice: 'Tùy điểm tham quan',
    openHours: 'Cả ngày',
    lat: 11.94,
    lng: 108.458,
    tags: ['Cao nguyên', 'Cà phê', 'Hoa'],
    whyGo: 'Không khí mát, nhịp chậm và cảnh quan khác biệt so với các thành phố biển.',
    travelTip: 'Mang áo khoác nhẹ; chợ đêm đông nên giữ đồ cá nhân cẩn thận.',
    imageKey: 'hoanKiemLake',
    sortOrder: 210,
    isFeatured: 0,
  },
  {
    id: 'langbiang',
    name: 'Langbiang',
    city: 'Đà Lạt',
    category: 'Núi',
    description:
      'Khu núi gần Đà Lạt với xe jeep, đường trekking và điểm nhìn xuống cao nguyên Lâm Viên.',
    history:
      'Langbiang gắn với truyền thuyết K’Lang và H’Biang, một câu chuyện quen thuộc của vùng cao nguyên.',
    bestTime: 'Sáng trời quang',
    ticketPrice: 'Vé vào cổng và xe jeep nếu sử dụng',
    openHours: 'Ban ngày',
    lat: 12.047,
    lng: 108.443,
    tags: ['Viewpoint', 'Trekking', 'Cao nguyên'],
    whyGo: 'Thêm vận động và góc nhìn thiên nhiên cho lịch trình Đà Lạt.',
    travelTip: 'Mang áo gió, trên cao có thể lạnh và nhiều gió.',
    imageKey: 'hoanKiemLake',
    sortOrder: 220,
    isFeatured: 0,
  },
  {
    id: 'ben_thanh',
    name: 'Chợ Bến Thành',
    city: 'TP. Hồ Chí Minh',
    category: 'Chợ',
    description:
      'Chợ biểu tượng của Sài Gòn với quầy ăn, vải vóc, quà lưu niệm và mặt tiền tháp đồng hồ quen thuộc.',
    history:
      'Tòa nhà chợ hiện tại hoạt động từ đầu thế kỷ 20 và trở thành biểu tượng trung tâm thành phố.',
    bestTime: 'Sáng cho đồ ăn, chiều cho mua sắm',
    ticketPrice: 'Miễn phí',
    openHours: 'Ban ngày, khu đêm tùy thời điểm',
    lat: 10.772,
    lng: 106.698,
    tags: ['Mua sắm', 'Ẩm thực', 'Biểu tượng'],
    whyGo: 'Một nơi gọn để chạm vào nhịp chợ, món ăn và quà lưu niệm Sài Gòn.',
    travelTip: 'Mặc cả khi mua quà, nhưng không mặc cả ở các quầy ăn có niêm yết.',
    imageKey: 'benThanhMarket',
    sortOrder: 230,
    isFeatured: 1,
  },
  {
    id: 'independence_palace',
    name: 'Dinh Độc Lập',
    city: 'TP. Hồ Chí Minh',
    category: 'Di tích',
    description:
      'Công trình hiện đại giữa trung tâm với phòng họp, hầm chỉ huy, sân vườn và nhiều dấu mốc lịch sử.',
    history:
      'Dinh Độc Lập gắn với các sự kiện quan trọng của Sài Gòn thế kỷ 20 và ngày thống nhất đất nước.',
    bestTime: 'Sáng trong tuần',
    ticketPrice: 'Vé tham quan theo quy định',
    openHours: 'Ban ngày',
    lat: 10.7771,
    lng: 106.6958,
    tags: ['Lịch sử', 'Kiến trúc', 'Trung tâm'],
    whyGo: 'Điểm lịch sử rõ ràng nhất ở trung tâm TP.HCM, dễ kết hợp với Nhà thờ Đức Bà và Bưu điện.',
    travelTip: 'Đọc sơ lược lịch sử trước khi đi để các phòng trưng bày có ý nghĩa hơn.',
    imageKey: 'benThanhMarket',
    sortOrder: 240,
    isFeatured: 0,
  },
  {
    id: 'cu_chi_tunnels',
    name: 'Địa đạo Củ Chi',
    city: 'TP. Hồ Chí Minh',
    category: 'Di tích',
    description:
      'Hệ thống đường hầm, hầm trú ẩn và mô phỏng đời sống chiến khu ở ngoại ô TP.HCM.',
    history:
      'Địa đạo Củ Chi là di tích chiến tranh nổi tiếng, phản ánh cách sinh tồn và chiến đấu dưới lòng đất.',
    bestTime: 'Sáng sớm',
    ticketPrice: 'Vé tham quan và di chuyển',
    openHours: 'Ban ngày',
    lat: 11.1433,
    lng: 106.4645,
    tags: ['Lịch sử', 'Ngoại ô', 'Chiến tranh'],
    whyGo: 'Một chuyến nửa ngày giúp hiểu thêm về lịch sử hiện đại ngoài khu trung tâm.',
    travelTip: 'Không phù hợp nếu bạn sợ không gian hẹp; có thể chỉ xem phần mô phỏng ngoài trời.',
    imageKey: 'benThanhMarket',
    sortOrder: 250,
    isFeatured: 0,
  },
  {
    id: 'phu_quoc',
    name: 'Phú Quốc',
    city: 'Phú Quốc',
    category: 'Đảo',
    description:
      'Đảo nghỉ dưỡng với bãi biển cát trắng, hoàng hôn đẹp, vườn quốc gia và nhiều tour đảo nhỏ.',
    history:
      'Phú Quốc là đảo lớn nhất Việt Nam, nổi tiếng với nước mắm, hồ tiêu và du lịch biển.',
    bestTime: 'Tháng 11 - 4',
    ticketPrice: 'Tùy bãi biển và tour',
    openHours: 'Cả ngày',
    lat: 10.289,
    lng: 103.984,
    tags: ['Đảo', 'Hoàng hôn', 'Nghỉ dưỡng'],
    whyGo: 'Lựa chọn biển nghỉ dưỡng mạnh nhất phía Nam, hợp kỳ nghỉ chậm hoặc tuần trăng mật.',
    travelTip: 'Ở phía tây nếu ưu tiên hoàng hôn, phía nam nếu muốn đi cáp treo và tour đảo.',
    imageKey: 'phuQuocBeach',
    sortOrder: 260,
    isFeatured: 1,
  },
  {
    id: 'sao_beach',
    name: 'Bãi Sao',
    city: 'Phú Quốc',
    category: 'Bãi biển',
    description:
      'Bãi biển cát sáng màu ở phía nam đảo, nước tương đối êm vào mùa đẹp.',
    history:
      'Bãi Sao trở thành một trong các bãi biển được nhắc đến nhiều nhất khi du lịch Phú Quốc phát triển.',
    bestTime: 'Mùa khô',
    ticketPrice: 'Miễn phí hoặc phí dịch vụ tùy khu',
    openHours: 'Cả ngày',
    lat: 10.055,
    lng: 104.035,
    tags: ['Biển', 'Cát trắng', 'Gia đình'],
    whyGo: 'Một lựa chọn tắm biển dễ chịu khi muốn rời khu trung tâm Dương Đông.',
    travelTip: 'Kiểm tra mùa gió vì chất lượng nước và rác biển thay đổi theo thời điểm.',
    imageKey: 'phuQuocBeach',
    sortOrder: 270,
    isFeatured: 0,
  },
  {
    id: 'mui_ne',
    name: 'Đồi cát Mũi Né',
    city: 'Mũi Né',
    category: 'Đồi cát',
    description:
      'Cảnh quan cát trắng, cát đỏ, xe jeep, bình minh và làng chài ven biển gần Phan Thiết.',
    history:
      'Mũi Né phát triển từ làng chài thành một trong các trung tâm nghỉ dưỡng biển nổi tiếng miền Nam Trung Bộ.',
    bestTime: 'Bình minh',
    ticketPrice: 'Tùy dịch vụ jeep hoặc ATV',
    openHours: 'Cả ngày',
    lat: 10.933,
    lng: 108.287,
    tags: ['Bình minh', 'Đồi cát', 'Jeep'],
    whyGo: 'Cảnh quan bán sa mạc hiếm thấy ở Việt Nam, rất hợp chuyến ngắn từ TP.HCM.',
    travelTip: 'Chốt giá jeep/ATV trước khi đi và mang kính chống cát.',
    imageKey: 'myKheBeach',
    sortOrder: 280,
    isFeatured: 1,
  },
  {
    id: 'fairy_stream',
    name: 'Suối Tiên Mũi Né',
    city: 'Mũi Né',
    category: 'Suối cạn',
    description:
      'Lối đi chân trần theo dòng suối nông giữa vách cát đỏ, cây xanh và các lớp đất nhiều màu.',
    history:
      'Suối Tiên là điểm cảnh quan tự nhiên gắn với tuyến tham quan đồi cát và làng chài Mũi Né.',
    bestTime: 'Sáng hoặc chiều mát',
    ticketPrice: 'Phí tham quan nhỏ tùy thời điểm',
    openHours: 'Ban ngày',
    lat: 10.951,
    lng: 108.278,
    tags: ['Đi bộ', 'Cát đỏ', 'Gia đình'],
    whyGo: 'Một trải nghiệm nhẹ, khác biển, dễ thêm vào tour Mũi Né nửa ngày.',
    travelTip: 'Mang dép dễ rửa và túi chống nước cho điện thoại.',
    imageKey: 'myKheBeach',
    sortOrder: 290,
    isFeatured: 0,
  },
  {
    id: 'can_tho',
    name: 'Chợ nổi Cái Răng',
    city: 'Cần Thơ',
    category: 'Chợ nổi',
    description:
      'Chợ nổi lớn của miền Tây với ghe thuyền bán trái cây, đồ ăn sáng và hàng hóa trên sông.',
    history:
      'Chợ nổi Cái Răng phản ánh đời sống thương hồ của Đồng bằng sông Cửu Long.',
    bestTime: '5:00 - 7:00 sáng',
    ticketPrice: 'Phí thuê thuyền',
    openHours: 'Sáng sớm',
    lat: 10.05,
    lng: 105.78,
    tags: ['Sông nước', 'Ẩm thực', 'Miền Tây'],
    whyGo: 'Một trong những trải nghiệm đặc trưng nhất khi đến miền Tây.',
    travelTip: 'Ngủ lại Cần Thơ đêm trước để đi chợ đúng giờ nhộn nhịp.',
    imageKey: 'caiRangFloatingMarket',
    sortOrder: 300,
    isFeatured: 1,
  },
  {
    id: 'ninh_kieu_wharf',
    name: 'Bến Ninh Kiều',
    city: 'Cần Thơ',
    category: 'Bến sông',
    description:
      'Không gian ven sông trung tâm Cần Thơ với cầu đi bộ, chợ đêm và bến tàu du lịch.',
    history:
      'Bến Ninh Kiều là điểm sinh hoạt ven sông lâu đời, gắn với hình ảnh đô thị Cần Thơ.',
    bestTime: 'Tối',
    ticketPrice: 'Miễn phí, tàu du lịch tính riêng',
    openHours: 'Cả ngày',
    lat: 10.0336,
    lng: 105.7883,
    tags: ['Ven sông', 'Chợ đêm', 'Đi bộ'],
    whyGo: 'Điểm dạo tối dễ chịu sau chợ nổi hoặc trước khi rời Cần Thơ.',
    travelTip: 'Kết hợp ăn tối ven sông và đi cầu đi bộ khi trời mát.',
    imageKey: 'caiRangFloatingMarket',
    sortOrder: 310,
    isFeatured: 0,
  },
  {
    id: 'ky_co',
    name: 'Kỳ Co',
    city: 'Quy Nhơn',
    category: 'Bãi biển',
    description:
      'Bãi biển nước xanh, vách đá và cano ra đảo, thường đi chung với Eo Gió trong ngày.',
    history:
      'Kỳ Co thuộc bán đảo Phương Mai, nổi lên cùng xu hướng du lịch biển Quy Nhơn những năm gần đây.',
    bestTime: 'Tháng 3 - 8',
    ticketPrice: 'Vé khu du lịch và cano tùy gói',
    openHours: 'Ban ngày',
    lat: 13.893,
    lng: 109.282,
    tags: ['Biển', 'Cano', 'Nam Trung Bộ'],
    whyGo: 'Một lựa chọn biển trong xanh, ít đô thị hơn Nha Trang hoặc Đà Nẵng.',
    travelTip: 'Đi khi biển êm; đặt tour có lịch rõ để tránh chờ cano lâu.',
    imageKey: 'myKheBeach',
    sortOrder: 320,
    isFeatured: 0,
  },
  {
    id: 'eo_gio',
    name: 'Eo Gió',
    city: 'Quy Nhơn',
    category: 'Mũi đá',
    description:
      'Cung đường ven vách đá, gió mạnh, tầm nhìn ra biển và các bậc thang ôm theo sườn núi.',
    history:
      'Eo Gió là thắng cảnh tự nhiên của bán đảo Phương Mai, trở thành điểm check-in nổi bật Quy Nhơn.',
    bestTime: 'Bình minh hoặc chiều muộn',
    ticketPrice: 'Vé tham quan tùy thời điểm',
    openHours: 'Ban ngày',
    lat: 13.887,
    lng: 109.293,
    tags: ['Viewpoint', 'Biển', 'Bình minh'],
    whyGo: 'Cảnh biển đá mạnh mẽ và dễ ghép với Kỳ Co trong cùng ngày.',
    travelTip: 'Giữ mũ và đồ nhẹ vì gió có thể rất mạnh trên lối đi ven đá.',
    imageKey: 'myKheBeach',
    sortOrder: 330,
    isFeatured: 0,
  },
];

const openVietnamTravelPlaceSeeds: StoredTravelPlace[] = wikimediaPlaces.map((place, index) => ({
  id: place.id,
  name: place.name,
  city: place.city,
  category: place.category,
  description: place.description,
  history: place.history,
  bestTime: place.bestTime,
  ticketPrice: place.ticketPrice,
  openHours: place.openHours,
  lat: place.lat,
  lng: place.lng,
  tags: place.tags,
  whyGo: place.whyGo,
  travelTip: place.travelTip,
  imageKey: imageKeyForOpenDataPlace(place),
  imageUrl: place.imageUrl,
  wikipediaUrl: place.wikipediaUrl,
  sourceUrl: place.sourceUrl,
  source: place.source,
  sortOrder: OPEN_DATA_SORT_OFFSET + index,
  isFeatured: 0,
}));

export const travelPlaceSeeds: StoredTravelPlace[] = [
  ...curatedTravelPlaceSeeds,
  ...openVietnamTravelPlaceSeeds,
];

function imageKeyForOpenDataPlace(place: WikimediaPlaceSeed): PlaceImageKey {
  const haystack = `${place.category} ${place.name} ${place.tags.join(' ')}`.toLowerCase();
  if (/biển|đảo|vịnh|beach|island|bay/.test(haystack)) return 'myKheBeach';
  if (/hang|động|cave/.test(haystack)) return 'phongNhaCave';
  if (/huế|cung|thành|di tích|palace|citadel/.test(haystack)) return 'hueImperialCity';
  if (/hội an|di sản|heritage|phố cổ/.test(haystack)) return 'hoiAnAncientTown';
  if (/chợ|market/.test(haystack)) return 'benThanhMarket';
  if (/sông|hồ|lake|river/.test(haystack)) return 'hoanKiemLake';
  if (/phú quốc/.test(haystack)) return 'phuQuocBeach';
  if (/hạ long/.test(haystack)) return 'haLongBay';
  return 'hoanKiemLake';
}

export async function loadTravelPlacesFromDatabase(): Promise<StoredTravelPlace[]> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrateTravelPlacesIfNeeded(db);
  const rows = await db.getAllAsync<TravelPlaceRow>(`
    SELECT
      id,
      name,
      city,
      category,
      description,
      history,
      best_time as bestTime,
      ticket_price as ticketPrice,
      open_hours as openHours,
      lat,
      lng,
      tags_json as tagsJson,
      why_go as whyGo,
      travel_tip as travelTip,
      image_key as imageKey,
      image_url as imageUrl,
      wikipedia_url as wikipediaUrl,
      source_url as sourceUrl,
      source,
      sort_order as sortOrder,
      is_featured as isFeatured
    FROM travel_places
    ORDER BY sort_order ASC, name ASC
  `);
  return rows.map(rowToStoredPlace);
}

async function migrateTravelPlacesIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS travel_places (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      history TEXT NOT NULL,
      best_time TEXT NOT NULL,
      ticket_price TEXT NOT NULL,
      open_hours TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      tags_json TEXT NOT NULL,
      why_go TEXT NOT NULL,
      travel_tip TEXT NOT NULL,
      image_key TEXT NOT NULL,
      image_url TEXT,
      wikipedia_url TEXT,
      source_url TEXT,
      source TEXT NOT NULL DEFAULT 'Curated',
      sort_order INTEGER NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_travel_places_city ON travel_places(city);
    CREATE INDEX IF NOT EXISTS idx_travel_places_featured ON travel_places(is_featured, sort_order);
  `);
  await ensureTravelPlaceColumns(db);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const countRow = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) as total FROM travel_places');
  const currentVersion = versionRow?.user_version ?? 0;
  const shouldSeed = currentVersion < DATABASE_VERSION || (countRow?.total ?? 0) !== travelPlaceSeeds.length;

  if (!shouldSeed) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM travel_places');
    const statement = await db.prepareAsync(`
      INSERT OR REPLACE INTO travel_places (
        id,
        name,
        city,
        category,
        description,
        history,
        best_time,
        ticket_price,
        open_hours,
        lat,
        lng,
        tags_json,
        why_go,
        travel_tip,
        image_key,
        image_url,
        wikipedia_url,
        source_url,
        source,
        sort_order,
        is_featured,
        updated_at
      ) VALUES (
        $id,
        $name,
        $city,
        $category,
        $description,
        $history,
        $bestTime,
        $ticketPrice,
        $openHours,
        $lat,
        $lng,
        $tagsJson,
        $whyGo,
        $travelTip,
        $imageKey,
        $imageUrl,
        $wikipediaUrl,
        $sourceUrl,
        $source,
        $sortOrder,
        $isFeatured,
        $updatedAt
      )
    `);
    try {
      const updatedAt = new Date().toISOString();
      for (const place of travelPlaceSeeds) {
        await statement.executeAsync({
          $id: place.id,
          $name: place.name,
          $city: place.city,
          $category: place.category,
          $description: place.description,
          $history: place.history,
          $bestTime: place.bestTime,
          $ticketPrice: place.ticketPrice,
          $openHours: place.openHours,
          $lat: place.lat,
          $lng: place.lng,
          $tagsJson: JSON.stringify(place.tags),
          $whyGo: place.whyGo,
          $travelTip: place.travelTip,
          $imageKey: place.imageKey,
          $imageUrl: place.imageUrl ?? null,
          $wikipediaUrl: place.wikipediaUrl ?? null,
          $sourceUrl: place.sourceUrl ?? null,
          $source: place.source ?? 'Curated',
          $sortOrder: place.sortOrder,
          $isFeatured: place.isFeatured,
          $updatedAt: updatedAt,
        });
      }
    } finally {
      await statement.finalizeAsync();
    }
  });

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function ensureTravelPlaceColumns(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(travel_places)');
  const columnNames = new Set(columns.map((column) => column.name));
  const additions: Array<[string, string]> = [
    ['image_url', 'TEXT'],
    ['wikipedia_url', 'TEXT'],
    ['source_url', 'TEXT'],
    ['source', "TEXT NOT NULL DEFAULT 'Curated'"],
  ];

  for (const [name, definition] of additions) {
    if (!columnNames.has(name)) {
      await db.execAsync(`ALTER TABLE travel_places ADD COLUMN ${name} ${definition}`);
    }
  }
}

function rowToStoredPlace(row: TravelPlaceRow): StoredTravelPlace {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    category: row.category,
    description: row.description,
    history: row.history,
    bestTime: row.bestTime,
    ticketPrice: row.ticketPrice,
    openHours: row.openHours,
    lat: row.lat,
    lng: row.lng,
    tags: parseTags(row.tagsJson),
    whyGo: row.whyGo,
    travelTip: row.travelTip,
    imageKey: row.imageKey,
    imageUrl: row.imageUrl ?? undefined,
    wikipediaUrl: row.wikipediaUrl ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    source: row.source ?? undefined,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
  };
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
