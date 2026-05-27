const run = async () => {
  try {
    const res = await fetch('http://api.20.193.248.35.sslip.io/api/videos');
    const data = await res.json();
    console.log('\n=== TRẠNG THÁI VIDEO TRÊN VM ===');
    
    if (!data.data || !data.data.videos || data.data.videos.length === 0) {
      console.log('⏳ Chưa có video nào xử lý xong (0/5 READY). Worker vẫn đang cày, ráng đợi thêm nhé!');
      return;
    }

    console.log(`Đã có ${data.data.videos.length}/5 video xử lý xong:`);
    data.data.videos.forEach(v => {
      console.log(`- ${v.title.padEnd(55)}: ✅ READY`);
    });
    
    if (data.data.videos.length < 5) {
      console.log('\n(Vẫn còn video đang xử lý, đợi đủ 5 cái rồi hẵng seed nhé!)');
    }
  } catch (err) {
    console.error('Lỗi khi gọi API:', err.message);
  }
};

run();
