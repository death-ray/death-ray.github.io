frekvenssitiedosto <- Sys.getenv ("FREKVENSSITIEDOSTO")
if (frekvenssitiedosto == "")
    stop ("Ympäristömuuttujaa FREKVENSSITIEDOSTO ei määritelty")

frekvenssit <- read.csv (frekvenssitiedosto, check.names = FALSE)

## valitaan nollasta poikkeavat sarakkeet
frekvenssit <- frekvenssit [, apply(frekvenssit,2,sum)>0] 

## lasketaan todennäköisyydet
todennakoisyydet <- frekvenssit / sum (sum (frekvenssit))

## marginaalitodennäköisyydet sanoille
sana.marginaalit <- apply (todennakoisyydet, 2, sum)

## P(sana|kappale)
ehdolliset <- sweep (todennakoisyydet, 2, sana.marginaalit, '/')

write.csv (ehdolliset,
           "p-sana-annettu-kappale.csv",
           row.names = FALSE)
