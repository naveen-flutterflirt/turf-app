export const uploadImageToS3 = async (
  imageUri: string,
  token: string,
  baseUrl: string
): Promise<{ url: string; key: string }> => {
  try {
    // 1. Get file details
    const filename = imageUri.split('/').pop() || 'upload.jpg';
    const extension = filename.split('.').pop()?.toLowerCase();
    
    let contentType = 'image/jpeg';
    if (extension === 'png') contentType = 'image/png';
    else if (extension === 'webp') contentType = 'image/webp';

    // 2. Request presigned URL
    console.log(`[Upload] Requesting presigned URL for ${filename} (type: ${contentType})`);
    
    // Trying both possible endpoints since API spec says /api/upload but app uses /owner/turfs
    let presignResponse = await fetch(`${baseUrl}/owner/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: filename,
        contentType: contentType,
        folder: 'turf-images',
      }),
    });

    if (presignResponse.status === 404) {
      console.log(`[Upload] /owner endpoint 404. Falling back to /api/upload/presigned-url`);
      presignResponse = await fetch(`${baseUrl}/api/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: filename,
          contentType: contentType,
          folder: 'turf-images',
        }),
      });
    }

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.error(`[Upload] Presigned URL request failed. Status: ${presignResponse.status}, Error: ${errorText}`);
      throw new Error(`Failed to get presigned URL: ${errorText}`);
    }

    const result = await presignResponse.json();
    console.log(`[Upload] Presigned URL response received:`, JSON.stringify(result));
    
    const { uploadUrl, fileUrl, key } = result.data || result;

    if (!uploadUrl) {
       console.error('[Upload] Presigned URL is missing from the backend response.');
       throw new Error('Presigned URL missing from response');
    }

    // 3. Upload to S3
    console.log(`[Upload] Fetching local image blob from URI: ${imageUri}`);
    
    // Using XMLHttpRequest to reliably get the blob from a local URI in React Native
    const blob: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error('[Upload] XHR Blob Error:', e);
        reject(new TypeError('Network request failed reading local file'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', imageUri, true);
      xhr.send(null);
    });

    console.log(`[Upload] Local blob size: ${blob.size} bytes. Starting PUT to S3...`);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    console.log(`[Upload] S3 PUT Response Status: ${uploadResponse.status} ${uploadResponse.statusText}`);

    if (!uploadResponse.ok) {
      const s3Error = await uploadResponse.text();
      console.error(`[Upload] S3 PUT Error body:`, s3Error);
      throw new Error(`S3 upload failed with status ${uploadResponse.status}: ${s3Error}`);
    }

    console.log(`[Upload] SUCCESS! Image uploaded to S3. File URL: ${fileUrl}`);

    return {
      url: fileUrl,
      key: key,
    };
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};
