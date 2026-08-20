import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { ArrowDown, ArrowDownUp, ArrowUp, Clock3, LocateFixed, MapPin, Navigation, Plus, Search, Trash2 } from 'lucide-react-native';
import { normalizeTranslationLanguage, useAppSelectedLanguage, type TranslationLanguageCode } from '../../../lib/translation/language';
import { calculateLiveTeamRoute, searchLiveTeamPlaces } from '../services/live-team-route-api';
import type { LiveTeamPlace, LiveTeamRoute, TransportationMode } from '../types';
import { LiveTeamMap } from './live-team-map';

type Copy = { title: string; origin: string; destination: string; stop: string; addStop: string; reverse: string; search: string; noResults: string; calculating: string; required: string; limit: string; remove: string; moveUp: string; moveDown: string; currentLocation: string; locating: string; locationDenied: string; locationUnavailable: string };
const copies: Record<TranslationLanguageCode, Copy> = {
  en: { title: 'Plan your route', origin: 'Starting point', destination: 'Final destination', stop: 'Stop', addStop: 'Add stop', reverse: 'Reverse route', search: 'Search', noResults: 'No matching places found.', calculating: 'Drawing route…', required: 'Add destinations in the order you want to visit them.', limit: 'You can add up to 10 places.', remove: 'Remove stop', moveUp: 'Move up', moveDown: 'Move down', currentLocation: 'Current location', locating: 'Locating…', locationDenied: 'Location permission is required.', locationUnavailable: 'Could not determine your current location.' },
  vi: { title: 'Lập lộ trình', origin: 'Điểm xuất phát', destination: 'Điểm đến cuối', stop: 'Điểm dừng', addStop: 'Thêm điểm đến', reverse: 'Đảo chiều lộ trình', search: 'Tìm', noResults: 'Không tìm thấy địa điểm phù hợp.', calculating: 'Đang vẽ đường đi…', required: 'Thêm các điểm đến theo đúng thứ tự muốn ghé.', limit: 'Có thể thêm tối đa 10 địa điểm.', remove: 'Xóa điểm dừng', moveUp: 'Chuyển lên', moveDown: 'Chuyển xuống', currentLocation: 'Vị trí hiện tại', locating: 'Đang định vị…', locationDenied: 'Cần cấp quyền vị trí để dùng GPS.', locationUnavailable: 'Không thể xác định vị trí hiện tại.' },
  ja: { title: 'ルートを計画', origin: '出発地', destination: '最終目的地', stop: '経由地', addStop: '目的地を追加', reverse: 'ルートを反転', search: '検索', noResults: '一致する場所がありません。', calculating: 'ルートを作成中…', required: '訪問する順番に目的地を追加してください。', limit: '最大10地点まで追加できます。', remove: '経由地を削除', moveUp: '上へ移動', moveDown: '下へ移動', currentLocation: '現在地', locating: '現在地を取得中…', locationDenied: '位置情報の許可が必要です。', locationUnavailable: '現在地を取得できません。' },
  ko: { title: '경로 계획', origin: '출발지', destination: '최종 목적지', stop: '경유지', addStop: '목적지 추가', reverse: '경로 반전', search: '검색', noResults: '일치하는 장소가 없습니다.', calculating: '경로 그리는 중…', required: '방문할 순서대로 목적지를 추가하세요.', limit: '최대 10개 장소를 추가할 수 있습니다.', remove: '경유지 삭제', moveUp: '위로 이동', moveDown: '아래로 이동', currentLocation: '현재 위치', locating: '위치 확인 중…', locationDenied: '위치 권한이 필요합니다.', locationUnavailable: '현재 위치를 확인할 수 없습니다.' },
  'zh-CN': { title: '规划路线', origin: '出发地', destination: '最终目的地', stop: '途经点', addStop: '添加目的地', reverse: '反转路线', search: '搜索', noResults: '未找到匹配地点。', calculating: '正在绘制路线…', required: '请按游览顺序添加目的地。', limit: '最多可添加10个地点。', remove: '删除途经点', moveUp: '上移', moveDown: '下移', currentLocation: '当前位置', locating: '正在定位…', locationDenied: '需要位置权限。', locationUnavailable: '无法获取当前位置。' },
  'zh-TW': { title: '規劃路線', origin: '出發地', destination: '最終目的地', stop: '停靠點', addStop: '新增目的地', reverse: '反轉路線', search: '搜尋', noResults: '找不到相符地點。', calculating: '正在繪製路線…', required: '請依造訪順序新增目的地。', limit: '最多可新增10個地點。', remove: '刪除停靠點', moveUp: '上移', moveDown: '下移', currentLocation: '目前位置', locating: '正在定位…', locationDenied: '需要位置權限。', locationUnavailable: '無法取得目前位置。' },
  th: { title: 'วางแผนเส้นทาง', origin: 'จุดเริ่มต้น', destination: 'จุดหมายสุดท้าย', stop: 'จุดแวะ', addStop: 'เพิ่มจุดหมาย', reverse: 'กลับเส้นทาง', search: 'ค้นหา', noResults: 'ไม่พบสถานที่ที่ตรงกัน', calculating: 'กำลังวาดเส้นทาง…', required: 'เพิ่มจุดหมายตามลำดับที่ต้องการแวะ', limit: 'เพิ่มได้สูงสุด 10 สถานที่', remove: 'ลบจุดแวะ', moveUp: 'เลื่อนขึ้น', moveDown: 'เลื่อนลง', currentLocation: 'ตำแหน่งปัจจุบัน', locating: 'กำลังระบุตำแหน่ง…', locationDenied: 'ต้องอนุญาตให้เข้าถึงตำแหน่ง', locationUnavailable: 'ไม่สามารถระบุตำแหน่งปัจจุบันได้' },
  fr: { title: 'Planifier l’itinéraire', origin: 'Point de départ', destination: 'Destination finale', stop: 'Étape', addStop: 'Ajouter une destination', reverse: 'Inverser le trajet', search: 'Rechercher', noResults: 'Aucun lieu correspondant.', calculating: 'Calcul de l’itinéraire…', required: 'Ajoutez les destinations dans l’ordre de visite.', limit: 'Vous pouvez ajouter jusqu’à 10 lieux.', remove: 'Supprimer l’étape', moveUp: 'Monter', moveDown: 'Descendre', currentLocation: 'Position actuelle', locating: 'Localisation…', locationDenied: 'L’autorisation de localisation est requise.', locationUnavailable: 'Impossible de déterminer votre position.' },
  de: { title: 'Route planen', origin: 'Startpunkt', destination: 'Endziel', stop: 'Zwischenstopp', addStop: 'Ziel hinzufügen', reverse: 'Route umkehren', search: 'Suchen', noResults: 'Keine passenden Orte gefunden.', calculating: 'Route wird gezeichnet…', required: 'Füge Ziele in der gewünschten Besuchsreihenfolge hinzu.', limit: 'Du kannst bis zu 10 Orte hinzufügen.', remove: 'Stopp entfernen', moveUp: 'Nach oben', moveDown: 'Nach unten', currentLocation: 'Aktueller Standort', locating: 'Standort wird ermittelt…', locationDenied: 'Standortberechtigung ist erforderlich.', locationUnavailable: 'Aktueller Standort konnte nicht ermittelt werden.' },
  es: { title: 'Planificar ruta', origin: 'Punto de partida', destination: 'Destino final', stop: 'Parada', addStop: 'Añadir destino', reverse: 'Invertir ruta', search: 'Buscar', noResults: 'No se encontraron lugares.', calculating: 'Trazando ruta…', required: 'Añade los destinos en el orden de visita.', limit: 'Puedes añadir hasta 10 lugares.', remove: 'Eliminar parada', moveUp: 'Subir', moveDown: 'Bajar', currentLocation: 'Ubicación actual', locating: 'Localizando…', locationDenied: 'Se requiere permiso de ubicación.', locationUnavailable: 'No se pudo determinar la ubicación actual.' },
};

type RouteField = { id: number; query: string; place: LiveTeamPlace | null };

export function LiveTeamRoutePlanner({ route, transportationMode, onRouteChange }: { route: LiveTeamRoute | null; transportationMode: TransportationMode; onRouteChange: (route: LiveTeamRoute | null) => void }) {
  const language = normalizeTranslationLanguage(useAppSelectedLanguage());
  const copy = copies[language];
  const initialPlaces = route ? [route.origin, ...(route.stops ?? []), route.destination] : [];
  const nextId = useRef(Math.max(2, initialPlaces.length));
  const calculationId = useRef(0);
  const [fields, setFields] = useState<RouteField[]>(() => initialPlaces.length >= 2
    ? initialPlaces.map((place, id) => ({ id, query: place.label, place }))
    : [{ id: 0, query: '', place: null }, { id: 1, query: '', place: null }]);
  const [searchTarget, setSearchTarget] = useState<number | null>(null);
  const [results, setResults] = useState<LiveTeamPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [locatingTarget, setLocatingTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async (index: number) => {
    const query = fields[index]?.query.trim() ?? '';
    if (query.length < 2) return;
    setSearching(true);
    setSearchTarget(index);
    setResults([]);
    setError(null);
    try {
      const places = await searchLiveTeamPlaces(query);
      setResults(places);
      if (!places.length) setError(copy.noResults);
    } catch (reason) {
      setResults([]);
      setError(reason instanceof Error ? reason.message : copy.noResults);
    } finally {
      setSearching(false);
    }
  };

  const choose = (place: LiveTeamPlace) => {
    if (searchTarget === null) return;
    setFields((current) => current.map((field, index) => index === searchTarget ? { ...field, query: place.label, place } : field));
    setResults([]);
    setSearchTarget(null);
    onRouteChange(null);
  };

  useEffect(() => {
    const places = fields.map((field) => field.place);
    const requestId = ++calculationId.current;
    if (places.length < 2 || places.some((place) => !place)) {
      setCalculating(false);
      return;
    }
    const controller = new AbortController();
    setCalculating(true);
    setError(null);
    void calculateLiveTeamRoute(places as LiveTeamPlace[], transportationMode, controller.signal).then((nextRoute) => {
      if (requestId === calculationId.current) onRouteChange(nextRoute);
    }).catch((reason) => {
      if (requestId === calculationId.current && reason instanceof Error && reason.name !== 'AbortError') setError(reason.message);
    }).finally(() => {
      if (requestId === calculationId.current) setCalculating(false);
    });
    return () => controller.abort();
  }, [fields, onRouteChange, transportationMode]);

  const updateQuery = (index: number, query: string) => {
    setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, query, place: null } : field));
    setResults([]);
    setSearchTarget(null);
    onRouteChange(null);
  };

  const useCurrentLocation = async (index: number) => {
    if (locatingTarget !== null) return;
    setLocatingTarget(index);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error(copy.locationDenied);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const place: LiveTeamPlace = {
        label: copy.currentLocation,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, query: place.label, place } : field));
      setResults([]);
      setSearchTarget(null);
      onRouteChange(null);
    } catch (reason) {
      setError(reason instanceof Error && reason.message === copy.locationDenied ? reason.message : copy.locationUnavailable);
    } finally {
      setLocatingTarget(null);
    }
  };

  const addStop = () => {
    if (fields.length >= 10) return setError(copy.limit);
    const field = { id: nextId.current++, query: '', place: null };
    setFields((current) => [...current.slice(0, -1), field, current[current.length - 1]]);
    setError(null);
    onRouteChange(null);
  };

  const removeStop = (index: number) => {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
    setResults([]);
    setSearchTarget(null);
    onRouteChange(null);
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    setFields((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResults([]);
    setSearchTarget(null);
    onRouteChange(null);
  };

  const reverse = () => {
    setFields((current) => [...current].reverse());
    setResults([]);
    setSearchTarget(null);
    onRouteChange(null);
  };

  return <View style={styles.card}>
    <View style={styles.heading}>
      <View style={styles.icon}><Navigation color="#da251d" size={20} /></View>
      <View style={styles.headingCopy}><Text style={styles.title}>{copy.title}</Text><Text style={styles.body}>{copy.required}</Text></View>
      <Pressable accessibilityLabel={copy.reverse} style={styles.reverseButton} onPress={reverse}><ArrowDownUp color="#64748b" size={18} /></Pressable>
    </View>

    <View style={styles.routeFields}>
      <View style={styles.routeLine} />
      {fields.map((field, index) => {
        const isOrigin = index === 0;
        const isDestination = index === fields.length - 1;
        const label = isOrigin ? copy.origin : isDestination ? copy.destination : `${copy.stop} ${index}`;
        return <View key={field.id} style={styles.routeFieldBlock}>
          <View style={styles.routeFieldRow}>
            <View style={[styles.pointBadge, isDestination && styles.destinationBadge]}><Text style={styles.pointBadgeText}>{String.fromCharCode(65 + index)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputRow}><TextInput value={field.query} onChangeText={(value) => updateQuery(index, value)} onSubmitEditing={() => void search(index)} returnKeyType="search" placeholder={label} style={styles.input} /><Pressable accessibilityLabel={`${copy.currentLocation} · ${label}`} style={styles.locationButton} onPress={() => void useCurrentLocation(index)}>{locatingTarget === index ? <ActivityIndicator color="#16794b" size="small" /> : <LocateFixed color="#16794b" size={18} />}</Pressable><Pressable accessibilityLabel={`${copy.search} ${label}`} style={styles.searchButton} onPress={() => void search(index)}>{searching && searchTarget === index ? <ActivityIndicator color="#ffffff" size="small" /> : <Search color="#ffffff" size={18} />}</Pressable></View></View>
            <View style={styles.orderControls}>
              <Pressable disabled={index === 0} accessibilityLabel={copy.moveUp} style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]} onPress={() => move(index, -1)}><ArrowUp color="#475569" size={15} /></Pressable>
              <Pressable disabled={index === fields.length - 1} accessibilityLabel={copy.moveDown} style={[styles.orderButton, index === fields.length - 1 && styles.orderButtonDisabled]} onPress={() => move(index, 1)}><ArrowDown color="#475569" size={15} /></Pressable>
              {!isOrigin && !isDestination ? <Pressable accessibilityLabel={copy.remove} style={[styles.orderButton, styles.removeButton]} onPress={() => removeStop(index)}><Trash2 color="#b42318" size={15} /></Pressable> : null}
            </View>
          </View>
          {searchTarget === index && results.length ? <View style={styles.results}>{results.map((place, resultIndex) => <Pressable key={`${place.latitude}-${place.longitude}-${resultIndex}`} style={styles.result} onPress={() => choose(place)}><MapPin color="#da251d" size={17} /><Text numberOfLines={2} style={styles.resultText}>{place.label}</Text></Pressable>)}</View> : null}
        </View>;
      })}
    </View>

    <Pressable style={styles.addStopButton} onPress={addStop}><Plus color="#da251d" size={18} /><Text style={styles.addStopText}>{copy.addStop}</Text><Text style={styles.placeCount}>{fields.length}/10</Text></Pressable>
    {error ? <Text selectable style={styles.error}>{error}</Text> : null}
    {calculating ? <View style={styles.loading}><ActivityIndicator color="#da251d" /><Text style={styles.loadingText}>{copy.calculating}</Text></View> : null}
    {route ? <><View style={styles.map}><LiveTeamMap members={[]} userId="route-preview" route={route} /></View><View style={styles.stats}><View style={styles.stat}><Navigation color="#168755" size={17} /><Text style={styles.statText}>{formatDistance(route.distanceMeters)}</Text></View><View style={styles.stat}><Clock3 color="#168755" size={17} /><Text style={styles.statText}>{formatDuration(route.durationSeconds)}</Text></View></View></> : null}
  </View>;
}

function formatDistance(meters: number) { return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`; }
function formatDuration(seconds: number) { const minutes = Math.max(1, Math.round(seconds / 60)); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 18, borderCurve: 'continuous', padding: 15, gap: 11, boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)' }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, headingCopy: { flex: 1 }, icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff1f0', alignItems: 'center', justifyContent: 'center' }, title: { color: '#111827', fontSize: 17, fontWeight: '900' }, body: { color: '#64748b', fontSize: 12, lineHeight: 18, fontWeight: '600' }, reverseButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  routeFields: { position: 'relative', gap: 10 }, routeLine: { position: 'absolute', left: 14, top: 28, bottom: 28, width: 2, backgroundColor: '#cbd5e1' }, routeFieldBlock: { gap: 7 }, routeFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, pointBadge: { zIndex: 2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#168755', borderWidth: 3, borderColor: '#ffffff' }, destinationBadge: { backgroundColor: '#da251d' }, pointBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' }, field: { flex: 1, gap: 4 }, label: { color: '#334155', fontSize: 11, fontWeight: '900' }, inputRow: { flexDirection: 'row', gap: 6 }, input: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 11, paddingHorizontal: 11, color: '#111827', fontSize: 12, fontWeight: '700', backgroundColor: '#ffffff' }, locationButton: { width: 43, borderRadius: 11, backgroundColor: '#ecfdf3', borderWidth: 1, borderColor: '#86efac', alignItems: 'center', justifyContent: 'center' }, searchButton: { width: 45, borderRadius: 11, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center' }, orderControls: { width: 32, gap: 3 }, orderButton: { width: 30, height: 27, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }, orderButtonDisabled: { opacity: 0.25 }, removeButton: { backgroundColor: '#fff1f0' },
  results: { marginLeft: 38, marginRight: 40, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' }, result: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, resultText: { flex: 1, color: '#334155', fontSize: 12, lineHeight: 17, fontWeight: '700' }, addStopButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#fecaca' }, addStopText: { color: '#b42318', fontSize: 12, fontWeight: '900' }, placeCount: { color: '#9f1239', fontSize: 10, fontWeight: '900', fontVariant: ['tabular-nums'] }, error: { color: '#b42318', fontSize: 12, fontWeight: '700' }, loading: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 10 }, loadingText: { color: '#64748b', fontSize: 12, fontWeight: '800' }, map: { height: 280, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e7efe8' }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ecfdf3', borderRadius: 11 }, statText: { color: '#166534', fontSize: 12, fontWeight: '900' },
});
