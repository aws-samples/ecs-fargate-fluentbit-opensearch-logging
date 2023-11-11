import {Context, S3Event} from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

const s3 = new S3Client();
const openSearchHost = process.env.OPENSEARCH_HOST;
export const handler = async (event: S3Event, context: Context): Promise<S3Event> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    try {
        const response = await s3.send(new GetObjectCommand(params));
        const str = await response.Body.transformToString();
        console.log(str)
        const jsonLines: string[] = str.split('\n');
        const jsonArray = [];
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const indexName = `nginx_logs-${year}${month}${day}`;
        for (const jsonLine of jsonLines) {
            // 跳过空行
            if (!jsonLine.trim()) {
                continue;
            }

            // 解析JSON数据
            try {
                jsonArray.push(JSON.stringify({ 'index': { '_index': indexName } }) + '\n');
                jsonArray.push(jsonLine + '\n');
            } catch (e) {
                console.error(`Failed to parse JSON: ${jsonLine}. Error: ${e}`);
            }
        }
        try {
            // 构造 OpenSearch 数据对象
            // 发送 POST 请求到 OpenSearch
            const response = await axios.post('https://' + openSearchHost + '/_bulk',
                jsonArray.join(''),
                {
                    headers: {
                        'Content-Type': 'application/x-ndjson',
                    },
                }
            );
            console.log('OpenSearch Response:', JSON.stringify(response.data));
        } catch (error) {
            console.error('Error saving data to OpenSearch:', error);
        }

    } catch (err) {
        console.log(err);
    }

    return event;
};
