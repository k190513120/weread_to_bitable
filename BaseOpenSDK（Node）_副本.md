![](Aspose.Words.086f8d17-3573-48ce-a402-fcb0ba90eebd.001.png "image899")

**BaseOpenSDK（Node.js）官方文档**

|<p>**概述**</p><p>[飞书开放平台](https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview)提供了一系列服务端的原子 API 来实现多元化的功能，其中就包括操作多维表格的数据。但是这一套流程需要申请开放平台应用，使用开放平台的鉴权体系，对于只想通过服务端脚本快速操作多维表格的开发者，流程未免显得繁琐。为此，我们新推出了多维表格独立的鉴权体系，开发者可以在网页端获取某个 Base 的授权码PersonalBaseToken，即可在服务端通过 SDK 操作 Base 数据。</p><p></p><p>[BaseOpenSDK](https://feishu.feishu.cn/docx/WL3odCnn3o42oFx2mxfcYRDgnYe) 接口定义和[飞书开放平台 OpenAPI](https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview) 完全一致，无需额外的学习成本。 我们将所有冗长的逻辑内置处理，提供完备的类型系统、语义化的编程接口，提高开发者的编码体验。😙</p><p></p><p>**概念**</p>|
| :- |

|**术语**|**解释**|**图示**|
| :-: | :-: | :-: |
|Base|多维表格文档||
|AppToken （又称 BaseId）|<p>Base 文档的唯一标识，可从 Base URL 路径参数 /base/:app\_token快速获得（图一）；但如果是 /wiki/ 路径，则不能便捷获得。</p><p>因此，我们建议直接通过[【开发工具】插件](https://feishu.feishu.cn/base/extension/replit_3c13eb5bb6ae63e6) 快速获取当前 Base 的 AppToken （又称 BaseId，见图二）。</p>|<p>![](Aspose.Words.086f8d17-3573-48ce-a402-fcb0ba90eebd.002.png)</p><p>![](Aspose.Words.086f8d17-3573-48ce-a402-fcb0ba90eebd.003.png)</p>|
|PersonalBaseToken|<p>Base 文档授权码。用户针对某个 Base 文档生成的鉴权凭证，使用凭证访问相应的接口可对 Base 数据进行读写。</p><p></p><p>注：使用 PersonalBaseToken 访问 OpenAPI 单文档限频 2qps，多文档支持并发。</p><p>( [PersonalBaseToken 使用指南](https://feishu.feishu.cn/docx/Samyd47njoe46wx6cgWcDIywnZZ)  ) </p>|![](Aspose.Words.086f8d17-3573-48ce-a402-fcb0ba90eebd.004.png)|

|<p></p><p><br>同步自文档: <https://feishu.feishu.cn/docx/AtcId8w25oAj4WxOaxicsXgGn8b#TutsdK77Zs4IdwbfLiyccDpUnKg></p>|
| :- |

<a name="heading_0"></a>**安装**

npm

|Shell<br>npm i -S @lark-base-open/node-sdk|
| :- |

yarn 

|Shell<br>yarn add @lark-base-open/node-sdk|
| :- |

<a name="heading_1"></a>**如何使用**

提供 ECMAScript，CommonJS 2个版本，支持原生 Javascript 和 Typescript 的使用，示例均以 Typescript 为例。

ECMAScript

|TypeScript<br>*import* { BaseClient } *from* '@lark-base-open/node-sdk';|
| :- |

CommonJS

|TypeScript<br>const { BaseClient } = require('@lark-base-open/node-sdk');|
| :- |

<a name="heading_2"></a>**API 调用**

SDK 提供了语义化的调用方式，只需要提供相关参数创建 client 实例，接着使用其上的语义化方法client.[业务域].[资源].[方法]即可完成 API 调用，调用过程及调用结果均有完备的类型进行提示。例如列出 Base 数据表记录：

|TypeScript<br>*import* { BaseClient } *from* '@lark-base-open/node-sdk';<br><br>*// 新建 BaseClient，填上需要操作的 Base 文档对应的 appToken 和 personalBaseToken*<br>const client = new BaseClient({<br>`  `appToken: 'xxx',<br>`  `personalBaseToken: 'xxx'<br>});<br><br>*// 列出数据表记录*<br>const res = *await* client.base.appTableRecord.list({<br>`  `// 路径参数。我们会自动为你填充 app\_token（appToken）参数，你无需手动添加<br>`  `path: {<br>`    `table\_id: 'tblxxxxxx'<br>`  `},<br>`  `// 查询参数<br>`  `params: {<br>`    `page\_size: 10,<br>`  `},<br>});|
| :- |

接口对应的 Http 参数说明：

|**接口参数名**|**描述**|
| :-: | :-: |
|path|Http 请求路径参数|
|params|Http 请求查询参数|
|data|Http 请求体|

<a name="heading_3"></a>**BaseClient构造参数：**

|**参数**|**描述**|**类型**|**必须**|**默认**|
| :-: | :-: | :-: | :-: | :-: |
|appToken|Base 文档的唯一标识，从 Base 网页的路径参数获取 /base/:app\_token|<p>string</p><p></p>|是|-|
|personalBaseToken|Base 文档授权码。从 Base 网页端 获取（如下图）|string|是|-|
|domain|应用的域，分为飞书、Lark|Domain|否|Domain.Feishu|
|httpInstance|SDK 发送请求的 http 实例。SDK *内部默认使用axios.create()构造出一个 defaultHttpInstance来进行 http调用。*|HttpInstance|否|defaultHttpInstance|
|loggerLevel|日志级别|LoggerLevel|否|info|
|logger|-|Logger|否|-|

![](Aspose.Words.086f8d17-3573-48ce-a402-fcb0ba90eebd.005.png)

<a name="heading_4"></a>**分页**

针对返回值以分页形式呈现的接口，对其提供了迭代器方式的封装（方法名后缀为WithIterator），提高易用性，消弭了根据 page\_toke n来反复获取数据的繁琐操作，如获取数据表记录列表：

|TypeScript<br>*// 每次处理20条数据<br>for* *await* (const data of *await* client.base.appTableRecord.listWithIterator({<br>`  `params: {<br>`    `page\_size: 20,<br>`  `},<br>`  `path: {<br>`    `table\_id: TABLEID<br>`  `}<br>})) {<br>`  `console.log(data.items);<br>}|
| :- |

|当然也可以使用无迭代器封装的版本，这时候需要自己每次根据返回的 page\_token 来手动进行分页调用。|
| :- |

<a name="heading_5"></a>**附件上传**

和调用普通 API 的方式一样，按类型提示传递参数即可，内部封装了对文件上传的处理。

|TypeScript<br>const filePath = path.resolve(\_\_dirname, 'file.jpeg')<br><br>const data = *await* client.drive.media.uploadAll({<br>`  `data: {<br>`    `file\_name: 'file.png', *// 文件名*<br>`    `parent\_type: 'bitable\_image', *// 附件为图片传 'bitable\_image'，为文件传 'bitable\_file'*<br>`    `parent\_node: client.appToken, *// 填写 appToken*<br>`    `size: fs.statSync(filePath).size, *// 文件大小*<br>`    `file: fs.createReadStream(filePath), *// 文件流*<br>`  `}<br>})<br>const fileToken = data.file\_token;|
| :- |

上传附件后添加到新建记录的附件字段

|TypeScript<br>await client.base.appTableRecord.create({<br>`  `path: {<br>`    `table\_id: TABLEID<br>`  `},<br>`  `data: {<br>`    `fields: {<br>`      `['附件']: [{<br>`        `"file\_token": fileToken // 👆🏻前面接口返回的 fileToken<br>`      `}]<br>`    `}<br>`  `}<br>})|
| :- |

<a name="heading_6"></a>**附件下载**

对返回的二进制流进行了封装，消弭了对流本身的处理，只需调用 writeFile方法即可将数据写入文件，如：

|TypeScript<br>const response = *await* client.drive.media.download({<br>`  `path: { file\_token: 'xxx' },<br>`  `*// 如果 Base 开启了高级权限，则需要填写 extra 参数，否则不用传。*<br>`  `params: { extra: JSON.stringify({<br>`    `"bitablePerm": {<br>`      `"tableId": 'tblxxx', *// 附件所在数据表Id*<br>`      `"attachments": {<br>`        `"fldxxxxxxx": { *// 附件字段 Id*<br>`            `"recxxxxxxx": [ *// 附件所在记录Id*<br>`              `"xxx" *// 附件 file\_token*<br>`            `]<br>`        `}<br>`      `}<br>`    `}<br>`  `}) }  <br>})<br>// 保存到本地 file.png 文件<br>*await* response.writeFile(path.resolve(\_\_dirname, 'file.png'));|
| :- |

<a name="heading_7"></a>**普通调用**

可以使用 client 上的 request 方法手动调用业务接口，我们同样帮你处理好了鉴权逻辑：

|TypeScript<br>*import* { BaseClient } *from* '@lark-base-open/node-sdk';<br><br>const client = new BaseClient({<br>`  `appToken: 'xxx',<br>`  `personalBaseToken: 'xxx'<br>});<br><br>// request 接口<br>const res = *await* client.request({<br>`  `method: 'POST',<br>`  `url: 'xxx',<br>`  `data: {},<br>`  `params: {},<br>});|
| :- |

|<a name="heading_8"></a>**接口范围列表**|
| :- |

|**业务域**|**资源**|**方法**|调用**示例**|
| :-: | :-: | :-: | :-: |
|base（多维表格）|app（多维表格）|[copy](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/copy)、[~~create~~](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/create)、[get](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/get)、[update](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/update)|拷贝多维表格：client.base.app.copy()|
||appDashboard（仪表盘）|[copy](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-dashboard/copy)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-dashboard/list)|<p>拷贝仪表盘：</p><p>client.base.appDashboard.copy()</p>|
||appRole（自定义角色）|[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role/delete)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role/list)、[update](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role/update)||
||appRoleMember（协作者）|[batchCreate](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role-member/batch_create)、[batchDelete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role-member/batch_delete)、[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role-member/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role-member/delete)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-permission/app-role-member/list)||
||appTable（数据表）|[batchCreate](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/batch_create)、[batchDelete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/batch_delete)、[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/delete)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/list)、[patch](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/patch)||
||appTableField（字段）|[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/delete)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/list)、[update](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/update)||
||appTableFormField（表单项）|[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/form/list)、[patch](https://open.feishu.cn/document/server-docs/docs/bitable-v1/form/patch)||
||appTableForm（表单）|[get](https://open.feishu.cn/document/server-docs/docs/bitable-v1/form/get)、[patch](https://open.feishu.cn/document/server-docs/docs/bitable-v1/form/patch-2)||
||appTableRecord（记录）|[batchCreate](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/batch_create)、[batchDelete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/batch_delete)、[batchUpdate](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/batch_update)、[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/delete)、[get](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/get)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list)、[update](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/update)||
||appTableView（视图）|[create](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-view/create)、[delete](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-view/delete)、[get](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-view/get)、[list](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-view/list)、[patch](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-view/patch)||
|drive（云文档-文件管理）|media（素材）|[download](https://open.feishu.cn/document/server-docs/docs/drive-v1/media/download)、[uploadAll](https://open.feishu.cn/document/server-docs/docs/drive-v1/media/upload_all)||

||
| :- |
<a name="heading_9"></a>**示例**

<a name="heading_10"></a>**一、批量查找替换多行文本**

|TypeScript<br>import { BaseClient } from '@lark-base-open/node-sdk';<br><br>// 新建 BaseClient，填写需要操作的 appToken 和 personalBaseToken<br>const client = new BaseClient({<br>`  `appToken: 'xxx',<br>`  `personalBaseToken: 'xxx'<br>});<br><br>const TABLEID = 'xxx';<br><br>interface IRecord {<br>`  `record\_id: string;<br>`  `fields: Record<string, any><br>}<br><br>// 查找替换<br>async function searchAndReplace(from: string, to: string) {<br>`  `// 获取当前表的字段信息<br>`  `const res = await client.base.appTableField.list({<br>`    `params: {<br>`      `page\_size: 100,<br>`    `},<br>`    `path: {<br>`      `table\_id: TABLEID,<br>`    `}<br>`  `});<br>`  `const fields = res?.data?.items || [];<br>`  `// 文本列<br>`  `const textFieldNames = fields.filter(field => field.ui\_type === 'Text').map(field => field.field\_name);<br><br>`  `// 遍历记录<br>`  `for await (const data of await client.base.appTableRecord.listWithIterator({ params: { page\_size: 50 }, path: { table\_id: TABLEID } })) {<br>`    `const records = data?.items || [];<br>`    `const newRecords: IRecord[] = [];<br>`    `for (const record of records) {<br>`      `const { record\_id, fields } = record || {};<br>`      `const entries = Object.entries<string>(fields);<br>`      `const newFields: Record<string, string> = {};<br>`      `for (const [key, value] of entries) {<br>`        `// 替换多行文本字段值<br>`        `if ((textFieldNames.includes(key)) && value) {<br>`          `const newValue = value.replace(new RegExp(from, 'g'), to);<br>`          `// 把需要替换的字段加入 newFields<br>`          `newValue !== value && (newFields[key] = newValue);<br>`        `}<br>`      `}<br>`      `// 需要替换的记录加入 newRecords<br>`      `Object.keys(newFields).length && newRecords.push({<br>`        `record\_id,<br>`        `fields: newFields,<br>`      `})<br>`    `}<br><br>`    `// 批量更新记录<br>`    `await client.base.appTableRecord.batchUpdate({<br>`      `path: {<br>`        `table\_id: TABLEID,<br>`      `},<br>`      `data: {<br>`        `records: newRecords<br>`      `}<br>`    `})<br>`  `}<br>`  `console.log('success')<br>}<br><br>searchAndReplace('abc', '23333333');<br><br>console.log('start')|
| :- |

<a name="heading_11"></a>**二、将链接字段对应的文件传到附件字段**

|TypeScript<br>import { BaseClient } from '@lark-base-open/node-sdk';<br>import axios from 'axios';<br>import { Readable } from 'stream';<br>import path from 'path'<br><br>// 新建 BaseClient，填入 appToken 和 personalBaseToken<br>const client = new BaseClient({<br>`  `appToken: 'xxx',<br>`  `personalBaseToken: 'xxx'<br>});<br><br>const TABLEID = 'xxx';<br>const LINK\_FIELD\_NAME = '链接'<br>const ATTACHMENT\_FIELD\_NAME = '附件'<br><br>async function downloadLinkAndUploadToAttachment() {<br>`  `// Step 1. 遍历记录<br>`  `const recordsIterator = client.base.appTableRecord.listWithIterator({<br>`    `path: { table\_id: TABLEID },<br>`    `params: { page\_size: 50 },<br>`  `});<br>`  `const updatedRecords = [];<br>`  `for await (const recordBatch of await recordsIterator) {<br>`    `for (const record of recordBatch.items) {<br>`      `// Step 2. 拿到链接字段值<br>`      `const imageUrl = record.fields[LINK\_FIELD\_NAME]?.link;<br>`      `if (imageUrl) {<br>`        `// Step 3 : 下载图片<br>`        `const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });<br>`        `const imageBuffer = Buffer.from(imageResponse.data, 'binary');<br>`        `// Step 4: 上传图片获取 file\_token<br>`        `const uploadedImage = await client.drive.media.uploadAll({<br>`          `data: {<br>`            `file\_name: 'image.png',<br>`            `parent\_type: 'bitable\_image',<br>`            `parent\_node: client.appToken,<br>`            `size: imageBuffer.length,<br>`            `file: Readable.from(imageBuffer),<br>`          `},<br>`        `});<br>`        `const fileToken = uploadedImage.file\_token;<br>`        `// Step 5: 更新到对应记录的附件字段<br>`        `updatedRecords.push({<br>`          `record\_id: record.record\_id,<br>`          `fields: {<br>`            `[ATTACHMENT\_FIELD\_NAME]: [{ file\_token: fileToken }],<br>`          `},<br>`        `});<br>`      `}<br>`    `}<br>`  `}<br>`  `// Step 6: 批量更新记录<br>`  `const batchUpdateResponse = await client.base.appTableRecord.batchUpdate({<br>`    `path: { table\_id: TABLEID },<br>`    `data: { records: updatedRecords },<br>`  `});<br>}|
| :- |

<a name="heading_12"></a>**在 Replit 上使用服务端 SDK**

我们提供了一个 [Replit 模板](https://replit.com/@shaoshuaife/BaseOpenSDK-Node-Playground#server.ts)，它使用 express.js 框架搭建了一个简单的服务器，监听了指定路径，当我们在 Base 上运行这个脚本，就会触发脚本函数的调用。

|TypeScript<br>import express from 'express'<br>import { searchAndReplace } from './playground/search\_and\_replace'<br><br>const app = express()<br>const port = 3000<br><br>// http trigger<br>app.get('/search\_and\_replace', async (req, res) => {<br>`  `await searchAndReplace('abc', '23333333');<br>`  `res.send('success!!!')<br>});<br><br>app.get('/', async (req, res) => {<br>`  `res.send('hello world')<br>});<br><br>app.listen(port, () => {<br>`  `// Code.....<br>`  `console.log('Listening on port: ' + port)<br>})|
| :- |

上述代码监听/search\_and\_replace接口路径，并执我们的[示例一](https://feishu.feishu.cn/docx/RlrpdAGwnoONCaxmIVQcD7MZnug#doxcnHEZOFDi6EMFwc2gKNwbG1f)中定义的函数，实现操作 Base 数据

<a name="heading_13"></a>**方式一：在 Base Script 使用 Replit 链接触发脚本调用**

1. 在 Replit 上 Fork [官方模板](https://replit.com/@lark-base/BaseOpenSDK-Node-Playground#playground/search_and_replace.ts)
2. 通过 Replit Secret 添加环境变量 APP\_TOKEN、PERSONAL\_BASE\_TOKEN
3. 点击 Run 起 Replit 服务
4. 拷贝 replit 项目域名 + 接口路径，填入 Base Script，保存后点击运行即可触发服务端脚本

   **[Screen Recording 2023-07-06 at 15.58.42.mov]**

   <a name="heading_14"></a>**方式二：Replit 服务端直接运行脚本**

   如果你的项目无需手动触发，可以直接在 Replit 控制台运行脚本

   |Shell<br>npx vite-node ./playground/search\_and\_replace|
   | :- |


