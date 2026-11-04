import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Button, Card, Copy, Field, SectionTitle, styles } from '@/features/order/ui';

import { ApiError, dailyApi, imageUrl, type Asset, type Dashboard, type Upload } from './api';
import { formatCountdown, readPending, statusLabel, validTime, writePending, type PendingPost } from './model';

function Feedback({ error, notice }: { error: string; notice: string }) {
  const theme = useTheme();
  return <>{error ? <ThemedText accessibilityRole="alert" style={{ color: '#B23A2F' }}>{error}</ThemedText> : null}
    {notice ? <ThemedText accessibilityRole="text" style={{ color: theme.link }}>{notice}</ThemedText> : null}</>;
}

function Photo({ uri, label, onRemove }: { uri: string; label: string; onRemove?: () => void }) {
  return <View style={local.photoWrap}>
    <Image source={{ uri }} contentFit="cover" style={local.photo} accessibilityLabel={label} />
    {onRemove && <Button secondary label="Bỏ ảnh" onPress={onRemove} />}
  </View>;
}

function ContentPanel({ data, busy, save, editing, setEditing }: {
  data: Dashboard; busy: boolean; save: (text: string, retained: string[], uploads: Upload[]) => Promise<void>;
  editing: boolean; setEditing: (value: boolean) => void;
}) {
  const [text, setText] = useState(data.content.text);
  const [retained, setRetained] = useState<Asset[]>(data.content.images);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState('');
  const theme = useTheme();
  function begin() { setText(data.content.text); setRetained(data.content.images); setUploads([]); setError(''); setEditing(true); }
  async function pick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, 20 - retained.length - uploads.length), quality: 1 });
      if (result.canceled) return;
      const added = result.assets.map(asset => ({
        uri: asset.uri, name: asset.fileName || `image-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg', size: asset.fileSize || 0, file: asset.file,
      }));
      const all = [...uploads, ...added];
      if (retained.length + all.length > 20 || added.some(file => !file.size || file.size > 20_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) ||
          retained.reduce((sum, asset) => sum + asset.bytes, 0) + all.reduce((sum, file) => sum + file.size, 0) > 100_000_000) {
        setError('Chọn tối đa 20 ảnh JPG, PNG hoặc WebP; mỗi ảnh tối đa 20 MB, tổng tối đa 100 MB.');
        return;
      }
      setUploads(all); setError('');
    } catch { setError('Không mở được thư viện ảnh. Vui lòng thử lại.'); }
  }
  return <Card><SectionTitle eyebrow="01 / Nội dung" title="Bài đăng của quán" description="Bản đã lưu sẽ dùng cho các lượt đăng tiếp theo." />
    {editing ? <View style={styles.gap}>
      <Field label="Nội dung bài đăng" value={text} onChangeText={setText} multiline maxLength={20000} style={[styles.input, styles.multiline, { minHeight: 180, color: theme.text, borderColor: theme.border }]} />
      <Copy muted>{text.length.toLocaleString('vi-VN')} / 20.000 ký tự</Copy>
      <Button secondary label="Chọn ảnh từ điện thoại" onPress={pick} disabled={busy || retained.length + uploads.length >= 20} />
      <Copy muted>{retained.length + uploads.length} ảnh · JPG, PNG, WebP · tối đa 20 MB mỗi ảnh</Copy>
      <View style={local.photos}>{retained.map(asset => <Photo key={asset.name} uri={imageUrl(asset.url)} label={asset.name} onRemove={() => setRetained(list => list.filter(item => item.name !== asset.name))} />)}
        {uploads.map((file, index) => <Photo key={`${file.uri}-${index}`} uri={file.uri} label={file.name} onRemove={() => setUploads(list => list.filter(item => item.uri !== file.uri))} />)}</View>
      <Copy muted>Lịch tự động tiếp tục dùng bản đã lưu trong lúc cô chỉnh sửa.</Copy>
      <Feedback error={error} notice="" />
      <Button label={busy ? 'Đang lưu…' : 'Lưu bài đăng'} disabled={busy || !text.trim() || retained.length + uploads.length === 0} onPress={() => save(text, retained.map(asset => asset.name), uploads)} />
      <Button secondary label="Hủy chỉnh sửa" onPress={() => { setEditing(false); setUploads([]); }} disabled={busy} />
    </View> : <View style={styles.gap}>
      <Copy>{data.content.text}</Copy>
      <View style={local.photos}>{data.content.images.map(asset => <Photo key={asset.name} uri={imageUrl(asset.url)} label={asset.name} />)}</View>
      <Button secondary label="Sửa bài đăng" onPress={begin} />
    </View>}
  </Card>;
}

function SchedulePanel({ data, times, setTimes, enabled, setEnabled, busy, save, now }: {
  data: Dashboard; times: string[]; setTimes: (times: string[]) => void; enabled: boolean;
  setEnabled: (enabled: boolean) => void; busy: boolean; save: () => void; now: number;
}) {
  const theme = useTheme();
  const schedule = data.schedule;
  const seconds = schedule.nextRunAt == null ? null : Math.max(0, Math.ceil((schedule.nextRunAt - now) / 1000));
  const changed = enabled !== schedule.enabled || JSON.stringify([...times].sort()) !== JSON.stringify([...(schedule.times || [])].sort());
  return <Card><SectionTitle eyebrow="02 / Hẹn giờ" title="Đăng theo giờ đã chọn" description="Lặp lại mỗi ngày theo giờ Việt Nam. Mỗi lượt đăng vào tất cả nhóm." />
    {times.map((time, index) => <View key={index} style={local.timeRow}>
      <ThemedText type="smallBold">Lượt {index + 1}</ThemedText>
      <TextInput accessibilityLabel={`Giờ đăng lượt ${index + 1}`} value={time} onChangeText={value => setTimes(times.map((item, i) => i === index ? value : item))}
        keyboardType="numbers-and-punctuation" placeholder="HH:mm" maxLength={5} style={[local.timeInput, { color: theme.text, borderColor: theme.border }]} />
      <Button secondary label="Bỏ" disabled={times.length === 1 || busy} onPress={() => setTimes(times.filter((_, i) => i !== index))} />
    </View>)}
    <Button secondary label="+ Thêm giờ đăng" onPress={() => {
      for (let minute = 0; minute < 1440; minute++) {
        const value = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
        if (!times.includes(value)) { setTimes([...times, value].sort()); break; }
      }
    }} disabled={busy || times.length >= 1440} />
    <View style={local.timeRow}><Copy>Bật lịch hằng ngày</Copy><Switch value={enabled} onValueChange={setEnabled} disabled={data.mode !== 'LIVE' || busy} /></View>
    <Button secondary label="Lưu lịch đăng" onPress={save} disabled={busy || !times.length || times.some(time => !validTime(time)) || new Set(times).size !== times.length} />
    {changed && <Copy muted>Có thay đổi chưa lưu.</Copy>}
    <View style={styles.gapSmall}>
      <ThemedText type="smallBold">Theo dõi lịch · {({ ACTIVE: 'ĐANG BẬT', DISABLED: 'ĐANG TẮT', PREPARE: 'CHẾ ĐỘ THỬ', PAUSED: 'TẠM DỪNG HÔM NAY' } as Record<string, string>)[schedule.status] || schedule.status}</ThemedText>
      {(schedule.status === 'ACTIVE' || schedule.status === 'PAUSED') && seconds !== null && <Copy large>{formatCountdown(seconds)}</Copy>}
      {schedule.nextRunAt && <Copy muted>Lần tiếp theo: {new Date(schedule.nextRunAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })} giờ Việt Nam</Copy>}
      {schedule.status === 'PREPARE' && <Copy muted>Cần chuyển backend sang LIVE để lịch tự đăng.</Copy>}
      {schedule.status === 'DISABLED' && <Copy muted>Lịch sẽ chưa chạy cho đến khi bật.</Copy>}
      {schedule.entries.map(entry => <View key={entry.time} style={local.timeRow}><Copy>{entry.time}</Copy><Copy muted>{statusLabel(entry.outcome)}</Copy></View>)}
    </View>
  </Card>;
}

function PublishPanel({ data, selected, setSelected, pending, busy, editing, now, post, pause }: {
  data: Dashboard; selected: string[]; setSelected: (ids: string[]) => void; pending: PendingPost | null;
  busy: boolean; editing: boolean; now: number; post: () => void; pause: () => void;
}) {
  const paused = data.settings.pausedDay === data.today;
  const theme = useTheme();
  return <Card><SectionTitle eyebrow="03 / Nhóm nhận bài" title="Gửi lời mời ăn sáng" />
    {data.content.groups.map(group => {
      const seconds = Math.max(0, Math.ceil(((data.cooldowns || {})[group.id] - now) / 1000)) || 0;
      const checked = selected.includes(group.id);
      return <View key={group.id} style={styles.gapSmall}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled: !!pending }} disabled={!!pending} onPress={() => setSelected(checked ? selected.filter(id => id !== group.id) : [...selected, group.id])} style={local.groupRow}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>{checked ? '☑' : '□'}</ThemedText><Copy>{group.name}</Copy>
        </Pressable>
        <Button secondary label="Mở nhóm Facebook ↗" onPress={() => Linking.openURL(group.url)} />
        {seconds > 0 && <Copy muted>Nhóm vừa được đăng ngay. Có thể đăng lại sau {formatCountdown(seconds)}.</Copy>}
      </View>;
    })}
    <Button label={pending ? 'Kiểm tra lượt vừa gửi' : data.mode === 'LIVE' ? `Đăng ngay · ${selected.length} nhóm` : `Thử soạn bài · ${selected.length} nhóm`}
      onPress={post} disabled={busy || editing || (!pending && (data.busy || paused || !selected.length))} />
    {editing && <Copy muted>Lưu hoặc hủy sửa bài trước khi đăng.</Copy>}
    <Button secondary label={paused ? 'Tiếp tục hôm nay' : 'Hết xôi hôm nay · Dừng đăng'} onPress={pause} disabled={busy || (paused && data.busy)} />
    {paused && <Copy muted>Lịch đã lưu sẽ tiếp tục vào ngày mai. Bài đang gửi hoặc đã gửi không bị thu hồi.</Copy>}
  </Card>;
}

function HistoryPanel({ data, busy, refresh, remove }: { data: Dashboard; busy: boolean; refresh: () => void; remove: (id?: string) => void }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  return <Card><SectionTitle eyebrow="Nhật ký" title="Các lượt gần đây" />
    <Button secondary label="Làm mới" onPress={refresh} disabled={busy} />
    {data.jobs.length === 0 && <Copy muted>Các lượt xử lý và kết quả từng nhóm sẽ xuất hiện tại đây.</Copy>}
    {data.jobs.map(job => <View key={job.id} style={local.job}>
      <Pressable accessibilityRole="button" onPress={() => setExpanded(list => list.includes(job.id) ? list.filter(id => id !== job.id) : [...list, job.id])}>
        <ThemedText type="smallBold">{job.mode === 'PREPARE' ? 'Thử soạn bài' : job.source === 'SCHEDULE' ? 'Đăng theo lịch' : 'Đăng ngay'} · {statusLabel(job.status)}</ThemedText>
        <Copy muted>{new Date(job.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · {job.items.length} nhóm</Copy>
      </Pressable>
      {(expanded.includes(job.id) || ['RUNNING', 'QUEUED'].includes(job.status)) && job.items.map(item => <View key={item.group.id} style={styles.gapSmall}>
        <Copy>{item.group.name} · {statusLabel(item.status)}</Copy><Copy muted>{item.message}</Copy>
        {!!item.postUrl && <Button secondary label="Xem bài trên Facebook ↗" onPress={() => Linking.openURL(item.postUrl!)} />}
      </View>)}
      <Button secondary label="Xóa lượt khỏi nhật ký" onPress={() => remove(job.id)} disabled={busy || data.busy} />
    </View>)}
    {!!data.jobs.length && <Button secondary label="Xóa toàn bộ nhật ký" onPress={() => remove()} disabled={busy || data.busy} />}
    {!!data.slots.length && <View style={styles.gapSmall}><Copy large>Lịch đã xử lý / bỏ qua</Copy>{data.slots.map(slot => <Copy key={slot.key} muted>{slot.key} · {statusLabel(slot.outcome)}</Copy>)}</View>}
  </Card>;
}

export function DailyPostView() {
  const [user, setUser] = useState<string | null>(null);
  const [username, setUsername] = useState('cotam');
  const [password, setPassword] = useState('');
  const [data, setData] = useState<Dashboard | null>(null);
  const [times, setTimes] = useState<string[]>(['06:00']);
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingPost | null>(null);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(0);
  const initialized = useRef(false);
  const inFlight = useRef(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await dailyApi.dashboard();
      if (!alive.current) return;
      setData(next); setError('');
      if (!initialized.current) {
        setTimes(next.settings.times || ['06:00']); setEnabled(next.settings.enabled);
        setSelected(next.content.groups.map(group => group.id)); initialized.current = true;
      }
    } catch (cause) {
      if (!alive.current) return;
      if (cause instanceof ApiError && cause.status === 401) { setUser(null); setData(null); initialized.current = false; }
      else setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu.');
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    dailyApi.me().then(account => { if (alive.current) { setUser(account.username); void refresh(); } })
      .catch(() => {}).finally(() => { if (alive.current) setCheckingAuth(false); });
    void readPending().then(value => { if (alive.current) setPending(value); })
      .finally(() => { if (alive.current) setPendingLoaded(true); });
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { alive.current = false; clearInterval(clock); };
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => { void refresh(); }, 4000);
    return () => clearInterval(timer);
  }, [user, refresh]);
  async function action(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setWorking(true); setError(''); setNotice('');
    try { await work(); await refresh(); }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { setUser(null); setData(null); initialized.current = false; }
      setError(cause instanceof Error ? cause.message : 'Không thực hiện được.');
    } finally { inFlight.current = false; setWorking(false); }
  }
  async function login() {
    await action(async () => {
      await dailyApi.login(username.trim(), password);
      const account = await dailyApi.me(); setUser(account.username); setPassword('');
      await refresh();
    });
  }
  async function post() {
    if (!data) return;
    await action(async () => {
      let request = pending;
      if (!request) {
        const blocked = data.content.groups.find(group => selected.includes(group.id) && Number(data.cooldowns?.[group.id] || 0) > Date.now());
        if (blocked) throw new Error(`${blocked.name}: vui lòng chờ 2 phút trước khi đăng lại.`);
        request = { requestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`, groupIds: selected };
        await writePending(request); setPending(request);
      }
      try {
        await dailyApi.post(request.requestId, request.groupIds);
        await writePending(null); setPending(null);
        setNotice('Laptop đã nhận yêu cầu. Cô có thể đóng điện thoại và xem kết quả sau.');
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 400) { await writePending(null); setPending(null); }
        throw cause;
      }
    });
  }
  function remove(id?: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(id ? 'Xóa lượt đăng này?' : 'Xóa toàn bộ nhật ký?')) {
        void action(async () => { if (id) await dailyApi.deleteJob(id); else await dailyApi.deleteAll(); setNotice('Đã xóa khỏi nhật ký.'); });
      }
      return;
    }
    Alert.alert(id ? 'Xóa lượt đăng này?' : 'Xóa toàn bộ nhật ký?', 'Thao tác này không thể hoàn tác. Lịch đã xử lý vẫn được ghi nhớ để tránh đăng lặp.', [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Xóa nhật ký', style: 'destructive', onPress: () => void action(async () => { if (id) await dailyApi.deleteJob(id); else await dailyApi.deleteAll(); setNotice('Đã xóa khỏi nhật ký.'); }) },
    ]);
  }
  if (checkingAuth) return <Copy muted>Đang kiểm tra phiên đăng nhập…</Copy>;
  if (!user) return <View style={styles.gap}>
    <SectionTitle eyebrow="Bài đăng buổi sáng" title="Đăng nhập Cô Tấm" description="Dùng tài khoản quản lý của bản web để điều khiển lịch và bài đăng trên laptop." />
    <Field label="Tài khoản" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
    <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
    <Feedback error={error} notice={notice} />
    <Button label={working ? 'Đang đăng nhập…' : 'Vào quản lý bài đăng'} onPress={() => void login()} disabled={working || !username.trim() || !password} />
  </View>;
  return <View style={styles.gap}>
    <SectionTitle eyebrow="Bài đăng buổi sáng" title="Chào Cô Tấm ☀" description="Lịch tự chạy trên laptop kể cả khi đóng điện thoại." />
    <Feedback error={error} notice={notice} />
    <Button secondary label="Đăng xuất" onPress={() => void action(async () => { await dailyApi.logout(); await writePending(null); setPending(null); setUser(null); setData(null); initialized.current = false; })} />
    {!data ? <Copy muted>Đang kết nối với laptop…</Copy> : <>
      <Card><ThemedText type="smallBold">{data.settings.pausedDay === data.today ? 'Quán đã dừng đăng hôm nay' : data.busy ? 'Laptop đang xử lý bài đăng' : data.mode === 'LIVE' ? 'Sẵn sàng đăng bài' : 'Đang thiết lập Facebook'}</ThemedText>
        <Copy muted>{data.mode === 'LIVE' ? 'Đăng thật' : 'Chế độ thử'}</Copy></Card>
      <ContentPanel data={data} busy={working} editing={editing} setEditing={setEditing}
        save={async (text, retained, uploads) => action(async () => { await dailyApi.saveContent(text, retained, uploads); setEditing(false); setNotice('Đã lưu bài đăng. Các lượt tiếp theo sẽ dùng bản mới.'); })} />
      <SchedulePanel data={data} times={times} setTimes={setTimes} enabled={enabled} setEnabled={setEnabled} busy={working} now={now}
        save={() => void action(async () => { if (new Set(times).size !== times.length) throw new Error('Mỗi lượt đăng cần một giờ khác nhau.'); const saved = await dailyApi.saveSettings(enabled, times); setTimes(saved.times); setEnabled(saved.enabled); setNotice('Đã lưu các giờ đăng.'); })} />
      <PublishPanel data={data} selected={selected} setSelected={setSelected} pending={pending} busy={working || !pendingLoaded} editing={editing} now={now}
        post={() => void post()} pause={() => void action(async () => { if (data.settings.pausedDay === data.today) await dailyApi.resume(); else await dailyApi.pause(); setNotice(data.settings.pausedDay === data.today ? 'Đã tiếp tục hôm nay.' : 'Đã dừng hôm nay.'); })} />
      <HistoryPanel data={data} busy={working} refresh={() => void refresh()} remove={remove} />
    </>}
  </View>;
}

const local = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrap: { width: 124, gap: 6 },
  photo: { width: 124, height: 124, borderRadius: 12 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  timeInput: { width: 100, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  job: { gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#B8A58B', paddingTop: 14 },
});
