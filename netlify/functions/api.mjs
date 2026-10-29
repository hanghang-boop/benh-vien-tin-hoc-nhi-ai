
import { getStore } from '@netlify/blobs';
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from 'node:crypto';
import tasks from '../../tasks.json' with { type: 'json' };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });

const fail = (message, status = 400) =>
  json({ error: message }, status);

const secret = () => process.env.APP_SECRET || '';
const teacherPassword = () =>
  process.env.TEACHER_PASSWORD || '';

const store = () => getStore({
  name: 'bvthn-records',
  consistency: 'strong'
});

const encode = o =>
  Buffer.from(JSON.stringify(o)).toString('base64url');

const sign = s =>
  createHmac('sha256', secret())
    .update(s)
    .digest('base64url');

const token = (role, code = '') => {
  const payload = encode({
    role,
    code,
    exp: Date.now() + 8 * 3600_000
  });
  return `${payload}.${sign(payload)}`;
};

function session(req) {
  const bearer = (
    req.headers.get('authorization') || ''
  ).replace(/^Bearer\s+/i, '');

  const [payload, mac] = bearer.split('.');
  if (!payload || !mac) return null;

  const expected = sign(payload);
  if (
    Buffer.byteLength(expected) !== Buffer.byteLength(mac) ||
    !timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(mac)
    )
  ) return null;

  try {
    const obj = JSON.parse(
      Buffer.from(payload, 'base64url')
    );
    return obj.exp > Date.now() ? obj : null;
  } catch {
    return null;
  }
}

const safeCode = c =>
  typeof c === 'string' &&
  /^[A-Z0-9_-]{2,24}$/.test(c);

const safePin = p =>
  typeof p === 'string' &&
  /^\d{4,8}$/.test(p);

const passHash = (p, salt) =>
  scryptSync(p, salt, 64).toString('hex');

const eq = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length &&
    timingSafeEqual(x, y);
};

const studentKey = c => `student-${c}`;

const eventKey = () =>
  `event-${Date.now()}-${randomBytes(9).toString('hex')}`;

// Đọc Netlify Blobs theo từng nhóm.
async function all(prefix) {
  const st = store();
  let cursor;
  const items = [];

  do {
    const page = await st.list({ prefix, cursor });
    const blobs = page.blobs || [];

    for (let i = 0; i < blobs.length; i += 8) {
      const batch = await Promise.all(
        blobs.slice(i, i + 8).map(blob =>
          st.get(blob.key, { type: 'json' })
        )
      );
      items.push(...batch.filter(Boolean));
    }

    cursor = page.cursor;
  } while (cursor);

  return items;
}

const correct = {
  '3-MOUSE1': 'Nháy đúp',
  '3-MOUSE2': 'Nháy chuột phải',
  '3-MOUSE3': 'Di chuyển con trỏ tới biểu tượng',
  '3-KEY1': 'Enter',
  '3-KEY2': 'Backspace',
  '3-KEY3': 'Space',
  '3-FILE1': 'Thư mục',
  '3-FILE2': 'hoa.png',
  '3-FILE3': 'BaiTinHoc',
  '3-INFO1': 'Hình ảnh',
  '3-INFO2': 'Âm thanh',
  '3-INFO3': 'Mang áo mưa',
  '3-SAFE1': 'Ngồi thẳng, mắt cách màn hình hợp lý',
  '3-SAFE2': 'Không',
  '3-SAFE3': 'Không chia sẻ mật khẩu',
  '3-DESK1': 'Chứa tệp đã xóa',
  '3-DESK2': 'Nháy đúp biểu tượng',
  '3-WEB1': 'Trang học tập do giáo viên giới thiệu',
  '3-WEB2': 'Báo người lớn hoặc giáo viên',
  '3-SAFE4': 'Nghỉ mắt và nhìn ra xa',

  '4-SAVE1': 'HocTap',
  '4-SAVE2': 'CayXanh.pptx',
  '4-SAVE3': 'Lưu',
  '4-SAVE4': 'Sao chép',
  '4-SAVE5': 'Khôi phục',
  '4-WORD1': 'Đậm',
  '4-WORD2': 'Căn giữa',
  '4-WORD3': 'Chọn từ đó',
  '4-SLIDE1': 'Tên bài trình bày',
  '4-SLIDE2': 'Tăng cỡ chữ',
  '4-SLIDE3': 'Đổi sang màu chữ tương phản',
  '4-SLIDE4': 'Rút gọn thành ý chính',
  '4-SLIDE5': 'Ảnh cây phù hợp',
  '4-SCR1': 'Khi bấm cờ xanh',
  '4-SCR2': 'Di chuyển 10 bước',
  '4-SCR3': 'Nói Xin chào',
  '4-SCR4': 'Bắt đầu → Di chuyển',
  '4-SCR5': 'Ghép liền nhau',
  '4-NET1': 'Hỏi giáo viên hoặc người lớn',
  '4-NET2': 'Xin phép bạn và người lớn phù hợp',
  '4-NET3': 'hình ảnh hoa sen',
  '4-NET4': 'Kiểm tra nguồn và hỏi giáo viên',
  '4-NET5': 'Mật khẩu cá nhân',

  '5-LOOP1': 'Lặp 4 lần',
  '5-LOOP2': 'Mãi mãi',
  '5-LOOP3': 'Bên trong khối lặp 3 lần',
  '5-LOOP4': '20',
  '5-LOOP5': '90',
  '5-ORDER1': 'Bắt đầu → Di chuyển → Xoay',
  '5-ORDER2': 'Đợi 1 giây',
  '5-ORDER3': 'Có chạm cạnh không?',
  '5-ORDER4': 'Nếu ... thì',
  '5-ORDER5': 'điểm > 5',
  '5-DOC1': 'Chọn đoạn văn',
  '5-DOC2': 'Căn đều hai bên',
  '5-DOC3': 'Tăng cỡ chữ',
  '5-DOC4': 'Lưu tệp',
  '5-SLIDE1': 'Mở đầu → Nội dung → Kết luận',
  '5-SLIDE2': 'Giảm hiệu ứng không cần thiết',
  '5-SLIDE3': 'Kiểm tra quyền sử dụng và ghi nguồn',
  '5-SLIDE4': 'Đọc và sửa lỗi chính tả',
  '5-SLIDE5': 'Trắng',
  '5-WEB1': 'cách chăm sóc hoa hồng',
  '5-WEB2': 'Nhận biết đó là nội dung quảng cáo',
  '5-WEB3': 'Không cung cấp và báo người lớn',
  '5-WEB4': 'Đối chiếu nguồn đáng tin và hỏi giáo viên',
  '5-WEB5': 'Ghi nguồn và tuân thủ quyền sử dụng'
};

const typed = {
  '3-SPACE': 'Em yêu Tin học',
  '3-CAPS': 'Em yêu Tin học',
  '3-KEY4': 'Em yêu Tin học.',
  '3-KEY5': 'Em yêu Tin học',
  '3-KEY6': 'Em yêu Tin học',
  '4-WORD4': 'Việt Nam',
  '4-WORD5': 'Em yêu trường em.',
  '5-DOC5': 'Bảo vệ môi trường'
};

const norm = v =>
  String(v || '')
    .trim()
    .normalize('NFC')
    .replace(/\s+/g, ' ');

const gradeOf = code => Number(code[0]);

function adviceFor(task, passed) {
  if (passed) {
    return `Tốt lắm! Em đã xử lý được lỗi “${task.name}”. Hãy thử làm lại để nhớ lâu.`;
  }
  return `Em hãy đọc kỹ yêu cầu “${task.prompt}”, quan sát kết quả rồi thử lại. Nếu còn khó, hãy hỏi giáo viên.`;
}

// Gemini có giới hạn thời gian chờ riêng.
async function gemini(prompt, max = 350) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    12000
  );

  try {
    const model =
      process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: max,
            temperature: 0.4
          }
        }),
        signal: controller.signal
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts
      ?.map(x => x.text || '')
      .join('')
      .slice(0, 1800) || null;
  } catch (e) {
    console.error('Gemini request error', e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Xử lý API chính.
async function handleRequest(req) {

  // Kiểm tra hoạt động không cần kết nối Blobs.
  if (
    req.method === 'GET' &&
    new URL(req.url).searchParams.get('health') === '1'
  ) {
    return json({
      ok: true,
      message: 'API đang hoạt động'
    });
  }

  if (req.method !== 'POST') {
    return fail('Chỉ hỗ trợ POST', 405);
  }

  if (!secret() || !teacherPassword()) {
    return fail(
      'Chưa cấu hình APP_SECRET và TEACHER_PASSWORD trong Netlify.',
      503
    );
  }

  let p;
  try {
    p = await req.json();
  } catch {
    return fail('Dữ liệu không hợp lệ');
  }

  if (!p || typeof p !== 'object') {
    return fail('Dữ liệu không hợp lệ');
  }

  const action = p.action;
  const auth = session(req);

  try {
    // Giáo viên không cần truy cập Blobs để đăng nhập.
    if (action === 'teacherLogin') {
      if (
        typeof p.password !== 'string' ||
        !eq(p.password, teacherPassword())
      ) {
        return fail('Sai mật khẩu giáo viên.', 401);
      }
      return json({ token: token('teacher') });
    }

    if (action !== 'register' &&
        action !== 'studentLogin' &&
        !auth) {
      return fail(
        'Phiên đăng nhập hết hạn. Hãy đăng nhập lại.',
        401
      );
    }

    const st = store();

    // Đăng ký học sinh.
    if (action === 'register') {
      const code = String(p.code || '')
        .trim().toUpperCase();
      const className = String(p.className || '')
        .trim().toUpperCase();
      const pin = p.pin;

      if (
        !safeCode(code) ||
        !safePin(pin) ||
        !/^[345][A-Z0-9_-]{0,19}$/.test(className) ||
        gradeOf(code) !== gradeOf(className)
      ) {
        return fail(
          'Mã, lớp hoặc PIN không hợp lệ. PIN gồm 4–8 chữ số.'
        );
      }

      if (await st.get(studentKey(code))) {
        return fail(
          'Mã học sinh đã tồn tại. Hãy chọn Đăng nhập.'
        );
      }

      const salt = randomBytes(16).toString('hex');

      await st.setJSON(studentKey(code), {
        code,
        className,
        salt,
        hash: passHash(pin, salt),
        assignments: [],
        created: Date.now()
      });

      return json({
        token: token('student', code),
        code,
        className
      });
    }

    // Đăng nhập học sinh.
    if (action === 'studentLogin') {
      const code = String(p.code || '')
        .trim().toUpperCase();

      const s = safeCode(code)
        ? await st.get(studentKey(code), {
            type: 'json'
          })
        : null;

      if (
        !s ||
        !safePin(p.pin) ||
        !eq(s.hash, passHash(p.pin, s.salt))
      ) {
        return fail(
          'Sai mã học sinh hoặc PIN.',
          401
        );
      }

      return json({
        token: token('student', code),
        code,
        className: s.className
      });
    }

    // Danh sách ca bệnh.
    if (action === 'tasks') {
      if (auth.role !== 'student') {
        return fail('Không có quyền', 403);
      }

      const s = await st.get(
        studentKey(auth.code),
        { type: 'json' }
      );

      if (!s) {
        return fail(
          'Mã học sinh không tồn tại',
          401
        );
      }

      return json({
        tasks: tasks
          .filter(t =>
            t.grade === gradeOf(s.className)
          )
          .map(({ grade, id, name, prompt }) => ({
            grade,
            id,
            name,
            prompt
          })),
        assignments: s.assignments || []
      });
    }

    // Nộp bài và chấm kết quả.
    if (action === 'submit') {
      if (auth.role !== 'student') {
        return fail('Không có quyền', 403);
      }

      const s = await st.get(
        studentKey(auth.code),
        { type: 'json' }
      );

      const task = tasks.find(
        t => t.id === p.taskId
      );

      if (
        !s ||
        !task ||
        task.grade !== gradeOf(s.className)
      ) {
        return fail(
          'Ca bệnh không hợp lệ',
          400
        );
      }

      const value = norm(p.value);

      if (!value || value.length > 300) {
        return fail(
          'Câu trả lời không hợp lệ'
        );
      }

      const expected =
        correct[task.id] ?? typed[task.id];

      if (!expected) {
        return fail(
          'Ca bệnh chưa có đáp án chuẩn',
          503
        );
      }

      const passed =
        norm(expected).toLocaleLowerCase('vi') ===
        value.toLocaleLowerCase('vi');

      const id = eventKey();
      const time = new Date().toISOString();

      await st.setJSON(id, {
        id,
        code: s.code,
        className: s.className,
        taskId: task.id,
        value,
        passed,
        time
      });

      return json({
        eventId: id,
        passed,
        advice: adviceFor(task, passed)
      });
    }

    // Lịch sử thực hành học sinh.
    if (action === 'myHistory') {
      if (auth.role !== 'student') {
        return fail('Không có quyền', 403);
      }

      const events = (await all('event-'))
        .filter(e => e.code === auth.code)
        .sort((a, b) =>
          a.time.localeCompare(b.time)
        );

      return json({ events });
    }

    // Gợi ý AI cho học sinh.
    if (action === 'advice') {
      if (auth.role !== 'student') {
        return fail('Không có quyền', 403);
      }

      const ev =
        typeof p.eventId === 'string' &&
        /^event-[0-9]+-[a-f0-9]+$/.test(p.eventId)
          ? await st.get(p.eventId, {
              type: 'json'
            })
          : null;

      if (!ev || ev.code !== auth.code) {
        return fail(
          'Không tìm thấy lượt thực hành',
          404
        );
      }

      const task = tasks.find(
        t => t.id === ev.taskId
      );

      if (!task) {
        return fail('Không tìm thấy ca bệnh', 404);
      }

      const fallback = adviceFor(
        task,
        ev.passed
      );

      const result = await gemini(
        `Bạn là giáo viên Tin học tiểu học Việt Nam. Chỉ dùng tiếng Việt, tối đa 90 từ, động viên học sinh, gợi ý cách tự sửa mà không tiết lộ thông tin cá nhân. Lớp ${task.grade}. Ca bệnh: ${task.name}. Yêu cầu: ${task.prompt}. Kết quả: ${ev.passed ? 'đạt' : 'chưa đạt'}. Hãy đưa 2-3 bước cụ thể.`
      );

      if (result) {
        try {
          await st.setJSON(
            ev.id || p.eventId,
            {
              ...ev,
              aiUsed: true,
              aiAt: new Date().toISOString()
            }
          );
        } catch (e) {
          console.error(
            'Không ghi được dấu AI',
            e
          );
        }
      }

      return json(
        result
          ? { advice: result }
          : {
              fallback,
              reason:
                'Gemini chưa được cấu hình hoặc tạm thời không phản hồi.'
            }
      );
    }

    // Các chức năng chỉ dành cho giáo viên.
    if (auth.role !== 'teacher') {
      return fail(
        'Chỉ giáo viên được thực hiện chức năng này.',
        403
      );
    }

    // Báo cáo lớp.
    if (action === 'report') {
      const students = (await all('student-'))
        .map(({
          code,
          className,
          assignments
        }) => ({
          code,
          className,
          assignments
        }))
        .sort((a, b) =>
          a.code.localeCompare(b.code)
        );

      const events = (await all('event-'))
        .sort((a, b) =>
          a.time.localeCompare(b.time)
        );

      return json({
        students,
        events,
        tasks: tasks.map(
          ({ grade, id, name }) => ({
            grade,
            id,
            name
          })
        )
      });
    }

    // Giao bài cho học sinh.
    if (action === 'assign') {
      const code = String(p.code || '')
        .toUpperCase();

      const task = tasks.find(
        t => t.id === p.taskId
      );

      const s = await st.get(
        studentKey(code),
        { type: 'json' }
      );

      if (
        !s ||
        !task ||
        task.grade !== gradeOf(s.className)
      ) {
        return fail(
          'Mã học sinh hoặc ca bệnh không hợp lệ'
        );
      }

      s.assignments = [
        ...new Set([
          ...(s.assignments || []),
          task.id
        ])
      ];

      await st.setJSON(studentKey(code), s);
      return json({ ok: true });
    }

    // Đặt lại PIN học sinh.
    if (action === 'resetPin') {
      const code = String(p.code || '')
        .toUpperCase();

      const s = await st.get(
        studentKey(code),
        { type: 'json' }
      );

      if (!s || !safePin(p.pin)) {
        return fail(
          'Mã học sinh hoặc PIN mới không hợp lệ'
        );
      }

      s.salt = randomBytes(16).toString('hex');
      s.hash = passHash(p.pin, s.salt);

      await st.setJSON(studentKey(code), s);
      return json({ ok: true });
    }

    // Gợi ý AI cho giáo viên.
    if (action === 'teacherAdvice') {
      const events = (await all('event-'))
        .sort((a, b) =>
          a.time.localeCompare(b.time)
        );

      const latest = new Map();

      for (const e of events) {
        latest.set(
          `${e.code}|${e.taskId}`,
          e
        );
      }

      const count = {};

      for (const e of latest.values()) {
        if (!e.passed) {
          count[e.taskId] =
            (count[e.taskId] || 0) + 1;
        }
      }

      const top = Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, n]) =>
          `${tasks.find(t => t.id === id)?.name || id}: ${n} học sinh`
        )
        .join('; ');

      const fallback = top
        ? `Nên tổ chức ôn tập theo nhóm nhỏ cho các lỗi: ${top}. Cho học sinh làm lại, sau đó đối chiếu kết quả lần đầu và lần cuối.`
        : 'Chưa có lỗi chưa đạt. Hãy giao bài phù hợp rồi xem tiến bộ sau khi học sinh thực hành.';

      const result = top
        ? await gemini(
            `Bạn là trợ lý chuyên môn cho giáo viên Tin học tiểu học. Các lỗi chưa đạt ở lượt gần nhất: ${top}. Viết tối đa 180 từ tiếng Việt, đúng 3 mục có đánh số: 1) Lỗi nên ưu tiên và nguyên nhân có thể; 2) Một hoạt động ôn tập 10 phút; 3) Cách kiểm tra lại sau ôn tập. Không đưa thông tin cá nhân. Đây chỉ là gợi ý, giáo viên là người quyết định.`,
            700
          )
        : null;

      return json(
        result
          ? { advice: result }
          : { fallback }
      );
    }

    return fail(
      'Chức năng không tồn tại',
      404
    );

  } catch (e) {
    console.error('BVTHN backend error', e);

    return fail(
      'Máy chủ gặp lỗi khi xử lý. Hãy kiểm tra Functions logs và Netlify Blobs.',
      500
    );
  }
}

// Giới hạn thời gian phản hồi ở mức ứng dụng.
// Promise.race không hủy các thao tác Blobs còn chạy.
export default async function handler(req) {
  let timer;

  try {
    return await Promise.race([
      handleRequest(req),

      new Promise(resolve => {
        timer = setTimeout(() => {
          resolve(
            fail(
              'Máy chủ phản hồi quá chậm. Hãy kiểm tra Netlify Blobs và Function logs.',
              503
            )
          );
        }, 15000);
      })
    ]);

  } catch (error) {
    console.error(
      'BVTHN unexpected error',
      error
    );

    return fail(
      'Máy chủ gặp lỗi. Hãy kiểm tra Function logs.',
      500
    );

  } finally {
    clearTimeout(timer);
  }
}
