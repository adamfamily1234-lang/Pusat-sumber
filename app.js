// Gantikan dengan maklumat dari Dashboard Supabase anda (Project Settings -> API)
const SUPABASE_URL = "https://anjcoojuerbekgassrrf.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamNvb2p1ZXJiZWtnYXNzcnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0Mjg2NTEsImV4cCI6MjEwNjAwNDY1MX0.L_X-J-dtUW9z2F0DPoWgwh5h57C0H9jFYuloIYY8BuQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Memampatkan gambar telefon pintar kepada resolusi web (Max 800px lebar, kualiti 70%)
 * Menukar saiz fail dari ~5MB kepada ~100KB - 150KB.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Gagal memampatkan gambar"));
          },
          "image/jpeg",
          0.7
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Muat naik gambar yang telah dimampatkan ke Supabase Storage (Bucket: book-covers)
 */
async function uploadCoverImage(blobFile) {
  const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
  const { data, error } = await supabase.storage
    .from("book-covers")
    .upload(fileName, blobFile, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("book-covers")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

/**
 * Simpan maklumat buku ke jadual 'books'
 */
async function registerBookRecord(bookData) {
  const { data, error } = await supabase
    .from("books")
    .insert([bookData])
    .select();

  if (error) throw error;
  return data;
}

/**
 * Ambil semua senarai buku dari Supabase
 */
async function fetchBooks() {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Kemas kini status pinjaman buku
 */
async function updateBookStatus(bookId, newStatus) {
  const { data, error } = await supabase
    .from("books")
    .update({ status: newStatus })
    .eq("id", bookId)
    .select();

  if (error) throw error;
  return data;
}