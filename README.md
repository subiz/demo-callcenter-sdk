# Tích hợp tổng đài Subiz

Subiz cung cấp SDK để bạn có thể thực hiện cuộc gọi trên browser
```
const SubizWebPhone = require('@subiz/wsclient/webphone.js')

let access_token = 'YOUR SUBIZ PERSONAL ACCESS TOKEN HERE';
let webphone = new SubizWebPhone(access_token)
webphone.makeCall('036411111', '0247123456')

```

Trước khi có thể Để sử dụng được SDK bạn cần
* Một tài khoản Subiz (đăng ký dùng thử miễn phí 30 ngày)
* Tạo được access token cho tài khoản này
* Một đầu số tổng đài đã đấu nối thành công vào Subiz

Để có thể sử dụng SDK hiệu quả, bạn nên dành thời gian hiểu qua các khái nhiệm chung của Subiz
### Khái niệm
#### User
Khách hàng của doanh nghiệp. User bao gồm các thông tin cơ bản: tên, email, SĐT, ảnh đại diện. Ngoài ra còn có thể có những thông tùy chọn riêng nhu cầu của doanh nghiệp như: ngày đăng ký, giới tính, số CMTND, ...

Khi có người nhắn tin vào Facebook fanpage, Zalo OA hay gọi vào số tổng đài của doanh nghiệp. Subiz tự tạo một user tương ứng. User này có thể chuyển qua CRM riêng của doanh nghiệp bằng webhook. Một bản ghi user sẽ có dạng như sau:

```js
{
  id: "usrvmnntjcngcoxnbuowf",
  account_id: "acpxkgumifuoofoosble",
  attributes: [
	  { key: "fullname", text: "Châu Anh" },
		{ key: "email", text: "chauanh@gmail.com" },
    { key: "last_login", datetime: "2023-12-04T13:05:28Z" },
    { key: "avatar_url", text: "https://vcdn.subiz-cdn.com/file/firvonruijswrmiwoddd" },
  ],
  lead_owners: ["agriviekoixdhmwpcc"],
  created: 1701136956337,
  updated: 1701695131849,
}
```

#### Agent
Dùng để chỉ một thành viên của nội bộ doanh nghiệp: sale, marketing, trực page, quản lý.
Mỗi agent sẽ được cấp một tài khoản (email/password) để sử dụng Subiz.
Agent có thể đăng nhập vào Subiz để tạo access_token cá nhân của mình, access_token này sau đó có thể dùng để gọi API.

#### Conversation - Hội thoại
Thể hiện một hội thoại (cuộc gọi) đã diễn ra. Đối tượng hội thoại sẽ ghi lại thời điểm xảy ra cuộc gọi, số tổng đài, số của khách, ghi âm và nhiều thông số của cuộc gọi.

Nếu có ID của hội thoại (giả sử là csrvqjiilytjxgffey), có thể dùng API để lấy thông tin về cuộc gọi.
```
GET https://api.subiz.com.vn/4.0/accounts/accid/conversations/csrvqjiilytjxgffey?x-access-token=access-token
```
Dưới đây là chi tiết của một cuộc gọi cụ thể (kết quả trả về của request GET trên)
```js
{
  "account_id": "acpxkgumifuoofoosble",
  "id": "csrvqjiilytjxgffey", // định danh cho hội thoại - cuộc gọi
  "created": 1701678775101, // thời gian tạo
  "members": [ // danh sách những người tham gia hội thoại (bao gồm khách, agent trả lời, giám sát viên, agent được transfer, ...)
    {
      "type": "agent",
      "id": "agqedvggzqocgkzfrk",
      "membership": "active",
      "joined_at": 1701678775303,
    },
    {
      "type": "user",
      "id": "usrlvtwuwieqxnkwhccts",
      "membership": "active",
      "call_answered": 1701678777397 // thời điểm khách nhấc máy
    }
  ],
  "ended": 1701678992911,
  "state": "ended",
  "touchpoint": { // nơi xảy ra cuộc gọi
    "id": "19006008",
    "channel": "call",
    "source": "842473021368"
  },
  "call": { // thông tin chi tiết cuộc gọi
    "started": 1701678775080,
    "answered": 1701678777323,
    "ended": 1701678992886,
    "to_number": "19006008",
    "from_number": "842473021368",
    "direction": "outbound", // chiều gọi: oubound - agent gọi đi, inbound - khách gọi tới
    "initial_by_phone_device": "phrjromwwuzyylzzhws",
    "duration_sec": 215,
    "status": "ended",
    "recorded_audio": { // file ghi âm
      "name": "2023-12-04_acpxkgumifuoofoosble_csrvqjiilytjxgffey_recorded.wav",
      "type": "audio/x-wav",
      "size": 3452844,
      "md5": "bebf7148fecf94c0e59843373ff88434",
      "url": "https://vcdn.subiz-cdn.com/file/firvqjjkjkwfiomjzaji", // url tới file ghi âm (public với những ai có đường link)
      "duration": 215,
    }
  },
}
```

## Sử dụng SDK
### Cài đặt SDK
```
npm --save @subiz/wsclient
```

### Thực hiện cuộc gọi đi
1. Tạo webphone
2. Gọi `webphone.makeCall`

```js
const SubizWebPhone = require('@subiz/wsclient/webphone.js')
let access_token = 'YOUR SUBIZ PERSONAL ACCESS TOKEN HERE';
let fromNumber = '0247123456' // số tổng đài
let toNumber = '036411111' // số của khách
let webphone = new SubizWebPhone(access_token)

webphone.makeCall(toNumber, fromNumber)
```

### Lắng nghe sự kiện của cuộc gọi
Bạn có thể gọi hàm `onEvent` để nhận các sự kiện realtime của cuộc gọi ví dụ: đổ chuông (call_dialing), kết thúc (call_ended)
```js
const SubizWebPhone = require('@subiz/wsclient/webphone.js')
let access_token = 'YOUR SUBIZ PERSONAL ACCESS TOKEN HERE';
let webphone = new SubizWebPhone(access_token)

webphone.onEvent(function (ev) { console.log("EVENT", ev) })
```

Các sự kiện sẽ có dạng như bên dưới
```
12/5/2023, 3:08:47 PM | { "type": "call_ringing", "data": {"call_info": {"started":1701763727793,"to_number":"0364821895","from_number":"02473021368","direction":"outbound","status":"dialing","device_id":"webrtcfxfqunbgcxiakdlrtrme","member_id":"agqmwfyuehpuzpehmv","call_id":"dc5a26f3-691b-21d3-5ad3-7cfd319fadb4"}}}

12/5/2023, 3:08:54 PM | { "type": "call_joined", "data": {"call_info": {"conversation_id":"csrvqyzdnelvzyanls","started":1701763727793,"answered":1701763734787,"to_number":"0364821895","from_number":"02473021368","direction":"outbound","status":"active","device_id":"webrtcfxfqunbgcxiakdlrtrme","member_id":"agqmwfyuehpuzpehmv","call_id":"dc5a26f3-691b-21d3-5ad3-7cfd319fadb4"}}}

12/5/2023, 3:09:00 PM | { "type": "call_ended", "data": {"call_info": {"conversation_id":"csrvqyzdnelvzyanls","started":1701763727793,"answered":1701763734787,"ended":1701763740189,"to_number":"0364821895","from_number":"02473021368","direction":"outbound","hangup_code":"Terminated","status":"ended","device_id":"webrtcfxfqunbgcxiakdlrtrme","member_id":"agqmwfyuehpuzpehmv","call_id":"dc5a26f3-691b-21d3-5ad3-7cfd319fadb4"}}}
```

### Lấy file ghi âm cuộc gọi
Sau khi cuộc gọi kết thúc, bạn có thể tải file ghi âm về (lưu ý bạn cần bật chức năng ghi âm cho đầu số trong giao diện cài đặt của Subiz).
```
let call = webphone.getCall(callid)
if (!call) return Promise.resolve(null)
let convoid = call.conversation_id
fetch(`https://api.subiz.com.vn/4.0/accounts/${accid}/conversations/${convoid}?x-access-token=${access_token}`).then((response) => {
	return response.json()
}).then(convo => {
  console.log("RECORDED URL", convo.call.recorded_audio.url)
})
```

Lưu ý: Ngay sau khi Subiz gửi cho bạn sự kiện kết thúc cuộc gọi. File ghi âm có thể chưa được trả về ngay. Subiz cần khoảng một vài giây để upload file tùy vào độ dài của cuộc gọi. Bạn nên có cơ chế retry để đảm bảo lấy được được URL của file ghi âm.


## Demo
![Demo](./demo.png "Demo")

Để chạy được bản demo, trước tiên bạn cần clone mã nguồn repository này
```sh
git clone https://github.com/subiz/demo-callcenter-sdk
```

Cài các thư viện cần thiết

```sh
npm i
```

Chạy server dev
```sh
npm run dev
```
```
> @subiz/callcenter-sdk@0.0.0 dev
> vite

The CJS build of Vite's Node API is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
Port 5173 is in use, trying another one...
Port 5174 is in use, trying another one...

  VITE v5.0.5  ready in 741 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
4:00:48 PM [vite] page reload demo.html
```

Truy cập http://localhost:5173/demo.html để vào trang demo. Ở đây bạn cần nhập token trước khi có thể thực hiện cuộc gọi đi.
