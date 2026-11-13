import '../styles/mission.css';

import tspsugar from '../assets/images/article-mission/too-much-sugar.webp';
import glutenfree from '../assets/images/article-mission/gluten-free.jpg';
import insuline_res from '../assets/images/article-mission/insulineresistance.jpg';
import meal_plan from '../assets/images/article-mission/meal-plan.webp';

const articles = [
  {
    image: insuline_res,
    alt: 'Insulin resistance',
    title: 'What Happens to Your Body When You Have Insulin Resistance',
  },
  {
    image: meal_plan,
    alt: 'Meal plan',
    title: '7-Day No-Sugar High-Fiber Meal Plan for Insulin Resistance',
  },
  {
    image: glutenfree,
    alt: 'Gluten free',
    title: 'Gluten free? Gotta be Bakerman’s Bakery.',
  },
];

export default function Mission() {
  return (
    <div className="mission-container">
      <div className="left-mission">
        <article className="mission-article">
          <section className="hero-section">
            <p className="mission-eyebrow">Misi kami</p>
            <h1>Nikmati manisnya tanpa kehilangan kontrol.</h1>
            <p>
              Bakerman Balance percaya bahwa moderasi lebih realistis daripada
              larangan. Kami membuat dessert yang enak, menampilkan gula secara
              transparan, dan membantu kamu mengatur budget manis mingguan.
            </p>
            <img className="assets" src={tspsugar} alt="Gula dan kesehatan" />
            <p>
              Gula bukan satu-satunya faktor penyebab diabetes — genetika,
              aktivitas, dan pola makan memainkan peran besar. Yang bisa kami
              bantu adalah membuat pilihan dessert lebih sadar, bukan menghakimi.
            </p>
          </section>

          <section className="challenge-section">
            <h2>Budget gula, bukan larangan.</h2>
            <p>
              Setiap member punya budget gula mingguan: 60 g untuk yang ingin
              lebih disiplin, 90 g untuk keseimbangan, atau 120 g untuk yang
              lebih longgar. Budget ini hanya menghitung gula dari produk
              Bakerman, bukan total diet harianmu.
            </p>
            <p>
              Setiap produk punya label: Ringan (≤10 g), Seimbang (11–20 g),
              Manja (21–35 g), dan Manja banget (&gt;35 g). Semua tetap dijual —
              kamu yang memilih.
            </p>
          </section>

          <section className="fitness-section">
            <h2>Bonus dari aktivitas, bukan hukuman.</h2>
            <p>
              Hubungkan Strava, lalu menit aktifmu menambah budget gula
              mingguan. Ini bukan ajakan “olahraga supaya boleh makan”, tapi
              cara membuat aktivitas dan kenikmatan dessert berjalan seimbang.
            </p>
            <ul>
              <li>30–59 menit aktif → +10 g</li>
              <li>60–89 menit → +20 g</li>
              <li>90–149 menit → +30 g</li>
              <li>≥150 menit → +45 g (maksimum)</li>
            </ul>
            <p>
              Hanya aktivitas GPS yang dihitung; manual upload dan e-bike tidak
              masuk. Bonus dibatasi agar tidak menjadi kompensasi berlebihan.
            </p>
          </section>

          <section className="how-it-works-section">
            <h2>Cara kerja Bakerman Balance.</h2>
            <ol>
              <li>Atur budget gula mingguan sesuai ritmemu.</li>
              <li>Pilih treat dengan label gula yang jelas.</li>
              <li>Pickup di Bakerman Dago, Bandung.</li>
            </ol>
          </section>

          <section className="empowering-section">
            <h2>Lebih dari bakery.</h2>
            <p>
              Kami ingin dessert tetap jadi bagian dari hidup yang seimbang,
              bukan sesuatu yang harus dihindari atau dibalas dengan rasa
              bersalah.
            </p>
          </section>

          <section className="movement-section">
            <h2>#BakermanBalance</h2>
            <p>
              Bagikan caramu menikmati dessert dengan sadar. Kami percaya
              kebiasaan kecil yang konsisten lebih kuat daripada aturan yang
              terlalu ketat.
            </p>
            <p className="mission-disclaimer">
              Bakerman Balance bukan alat medis. Jika kamu memiliki kondisi
              kesehatan tertentu, konsultasikan pilihan makananmu dengan tenaga
              kesehatan.
            </p>
          </section>
        </article>
      </div>

      <aside className="right-mission">
        <h2>Bacaan lain</h2>
        <div className="aside-info">
          {articles.map((article) => (
            <div className="article-advertise" key={article.title}>
              <img
                className="assets"
                src={article.image}
                alt={article.alt}
                loading="lazy"
                decoding="async"
              />
              <p className="aside-desc">{article.title}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
