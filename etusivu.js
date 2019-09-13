var TAAJUUS = 10; // piirtotaajuus

var canvas;
var ylaElementti; // div-elementti, johon canvas piirretään
var kappaletiedostot;
var kappaleidenNimet;
var kappaleita;
var kappaleElementit;
var kappaleEtaisyydet;
var pSanaAnnettuKappaleP5Taulukko;
var avainsanat;
var avainsanakartat;

// avainsanakartan koordinaatit ja koot lasketaan suurimman kirjainkoon
// monikertoina
function Avainsanateksti (sanaIndeksi, todennakoisyys, suurinTn)
{
    this.sanaIndeksi = sanaIndeksi;
    // kerroin on vähintään 0.2
    this.kirjainkokoKerroin = max (todennakoisyys / suurinTn, .2);
    this.x = 0;
    this.y = 0;
    
    this.asetaPaikka = function (x, y)
    {
        this.x = x;
        this.y = y;
    };
    
    this.piirra = function (ikkunaLeveys, ikkunaKorkeus,
                            ikkunaX, ikkunaY,
                            suurinKirjainkoko)
    {
        var kirjainKoko = suurinKirjainkoko * this.kirjainkokoKerroin
        var x = ikkunaX + .5 * ikkunaLeveys + suurinKirjainkoko * this.x;
        var y = ikkunaY + .5 * ikkunaKorkeus + suurinKirjainkoko * this.y;
        if (x < windowWidth
            && y - kirjainKoko / 2 >= 0
            && y + kirjainKoko / 2 <= windowHeight)
        {
            textSize (kirjainKoko);
            textAlign (CENTER, CENTER);
            text (avainsanat [sanaIndeksi], x, y);
        }
    };

    // mikä tulisi kirjainkooksi tällä avainsanatekstillä?
    this.kirjainkoko = function (ikkunaLeveys, maxKirjainkoko)
    {
        textSize (maxKirjainkoko);
        var testiLeveys = textWidth (avainsanat [sanaIndeksi]);
        var ehdotettuKoko = ikkunaLeveys / testiLeveys * maxKirjainkoko * .9;
        return (min (ehdotettuKoko, maxKirjainkoko));
    }
};

function Avainsanakartta (avainsanat,
                          todennakoisyydet)
{
    this.aktiivinen = false;
    this.alpha = 0; // "läpinäkymättömyys"
    
    // järjestele todennäköisyyksien mukaan
    var jarjLista = [];
    for (var i = 0; i < avainsanat.length; i++)
        jarjLista.push ({"indeksi" : i, "tn" : todennakoisyydet [i]});
    jarjLista.sort (function (a, b)
                    {
                        return ((a.tn < b.tn) ? 1 : ((a.tn == b.tn) ? 0 : -1));
                    });
    
    // paikalliset muuttujat, joihin järjestetyt tallennetaan
    var sanaindeksit = [];
    var tnt = []; // todennäköisyydet
    for (var i = 0; i < jarjLista.length; i++)
    {
        sanaindeksit.push (jarjLista [i].indeksi);
        tnt.push (jarjLista [i].tn);
    }

    // jäsenmuuttuja, jossa avaintekstit suhteellisine kokoineen
    this.avainsanatekstit = [];
    for (var i = 0; i < tnt.length; i++)
        if (tnt [i] > 0)
            this.avainsanatekstit.push (new Avainsanateksti
                                        (sanaindeksit [i],
                                         tnt [i],
                                         tnt [0]));
        
    var yYla = 0, yAla = 0;
    // lasketaan kartan suhteelliset paikat valmiiksi; korkeudet ovat
    // suurimman kirjainkoon monikertoja
    for (var i = 0; i < this.avainsanatekstit.length; i++)
    {
        var tamanKorkeus = this.avainsanatekstit [i].kirjainkokoKerroin;
        var yTama;
        if (i == 0) // ensimmäinen sana keskelle
        {
            yTama = 0;
            yAla = tamanKorkeus / 2;
            yYla = -yAla;
        }
        else if (i % 2 == 0) // alas
        {
            yTama = yAla + tamanKorkeus / 2;
            yAla += tamanKorkeus;;
        }
        else
        {
            yTama = yYla - tamanKorkeus / 2;
            yYla -= tamanKorkeus;
        }
        
        this.avainsanatekstit [i].asetaPaikka ((i == 0 ? 0 : random (-1, 2)),
                                               yTama);
    }
    
    this.piirra = function (leveys, korkeus, x, y)
    {
        var alphaMuutos = 5;
        
        if (this.aktiivinen)
        {
            this.alpha += alphaMuutos;
            this.alpha = min (this.alpha, 100);
        }
        else
        {
            this.alpha -= alphaMuutos;
            this.alpha = max (this.alpha, 0);
        }
        
        if (this.alpha > 0)
        {
            fill (0, 0, 0, this.alpha);
            var suurinKoko =
                this.avainsanatekstit [0].kirjainkoko (leveys, korkeus / 10);
                
            for (var i = 0; i < this.avainsanatekstit.length; i++)
                this.avainsanatekstit [i].piirra (leveys, korkeus,
                                                  x, y,
                                                  suurinKoko);
        }
    };
    
};

var t; // otettujen aika-askeleiden lukumäärä

function preload ()
{
    kappaletiedostot = loadStrings ("kappaletiedostot.txt");
    kappaleidenNimet = loadStrings ("kappaleiden-nimet.txt");
    pSanaAnnettuKappaleP5Taulukko = loadTable ("p-sana-annettu-kappale.csv",
                                               "csv");
}

function setup ()
{
    ylaElementti = select ("#frontpage-canvas");
    var koko = ylaElementti.size ();
    canvas = createCanvas (koko.width, koko.height);
    canvas.parent (ylaElementti);

    fill (200);
    
    kappaleita = kappaletiedostot.length;
    kappaleElementit = new Array ();
    kappaleEtaisyydet = new Array ();

    // luodaan linkit kappaleisiin
    for (var i = 0; i < kappaleita; i++)
    {
        kappaleElementit [i] = createA (kappaletiedostot [i] + ".html",
                                        kappaleidenNimet [i]);
        kappaleElementit [i].class ("chapterlink");
    }
    asetaElementit ();

    // luetaan avainsanat sekä niiden ehdolliset todennäköisyydet
    var riveja = pSanaAnnettuKappaleP5Taulukko.getRowCount ();
    var sarakkeita = pSanaAnnettuKappaleP5Taulukko.getColumnCount ();
    
    // avainsanat 1. riviltä
    avainsanat = new Array (sarakkeita);
    for (var s = 0; s < sarakkeita; s++)
        avainsanat [s] = pSanaAnnettuKappaleP5Taulukko.getString (0, s);
    
    // muut jäljemmiltä riveiltä (oletetaan, että (riveja-1)==kappaleita
    var pSanaAnnettuKappaleTaulukko = new Array (kappaleita);
    for (var r = 1; r < riveja; r++)
    {
        pSanaAnnettuKappaleTaulukko [r - 1] = new Array (sarakkeita);
        for (var s = 0; s < sarakkeita; s++)
            pSanaAnnettuKappaleTaulukko [r - 1][s] = parseFloat (pSanaAnnettuKappaleP5Taulukko.getString (r, s));
    }
    
    avainsanakartat = [];
    for (var i = 0; i < kappaleita; i++)
        avainsanakartat.push (new Avainsanakartta (avainsanat,
                                                   pSanaAnnettuKappaleTaulukko [i]));

    frameRate (TAAJUUS);
    t = 0;
    redraw ();
}

function draw ()
{
    clear ();
    
    // päivitetään etäisyydet kerran sekunnissa
    var elementtiPaikka = ylaElementti.position ();
    if (t % TAAJUUS == 0)
    {
        for (var i = 0; i < kappaleita; i++)
        {
            var pos = kappaleElementit [i].position ();
            // hiiren koordinaatit ovat piirtoikkunan koordinaateissa,
            // kappale-elementtien sivun koordinaateissa
            kappaleEtaisyydet [i] = dist (mouseX,
                                          mouseY,
                                          pos.x - elementtiPaikka.x,
                                          pos.y - elementtiPaikka.y);
        }
    }
    
    var lahin = 0; // lähimmän kappaleen indeksi
    for (var i = 0; i < kappaleita; i++)
    {
        avainsanakartat [i].aktiivinen = false;
        
        if (kappaleEtaisyydet [i] < kappaleEtaisyydet [lahin])
            lahin = i;
    }
    avainsanakartat [lahin].aktiivinen = true;
    
    for (var i = 0; i < kappaleita; i++)
        avainsanakartat [i].piirra (.4 * windowWidth, .6 * windowHeight,
                                    .6 * windowWidth, .2 * windowHeight);

    t++;
}

function asetaElementit ()
{
    // tässä funktiossa olevat kertoimet on kehitelty pitkälti
    // kokeilemalla, että lopputulos on järjellisen näköinen
    var x = windowWidth / 10;
    var korkeus = windowHeight / (2 * kappaleita + 1);
    var canvasY = canvas.position ().y;
    
    for (i = 0; i < kappaleita; i++)
    {
        kappaleElementit [i].position (x, canvasY + 1.7 * (i + 1) * korkeus);
        kappaleElementit [i].style ("font-size", korkeus);
    }
}

function windowResized ()
{
    var koko = ylaElementti.size ();
    resizeCanvas (koko.width, koko.height);
    asetaElementit ();
}

