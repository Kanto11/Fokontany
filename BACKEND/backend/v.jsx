 <h3>Enfant</h3>
              {enfants.map((en, i) => (
              <fieldset key={i}>
                <legend>Enfant N°{i + 1}</legend>
                <input placeholder="Nom" value={en.nom_Ef}
                  onChange={(e) => changerEnfant(i, "nom_Ef", e.target.value)} required />
                <input placeholder="Prénom" value={en.prenom_Ef}
                  onChange={(e) => changerEnfant(i, "prenom_Ef", e.target.value)} required />
                <input type="date" value={en.date_nais_Ef}
                  onChange={(e) => changerEnfant(i, "date_nais_Ef", e.target.value)} required />
                <input placeholder="Lieu de naissance" value={en.lieu_nais_Ef}
                  onChange={(e) => changerEnfant(i, "lieu_nais_Ef", e.target.value)} required />
                <select value={en.nationalite}
                  onChange={(e) => changerEnfant(i, "nationalite", e.target.value)} required>
                  <option value="">Nationalité</option>
                  {nationalites.map((n) => <option key={n.id} value={n.id}>{n.nationalite ?? n.id}</option>)}

                  
                </select>
                <button type="button" onClick={() => retirerEnfant(i)}>Retirer</button>
              </fieldset>
            ))}
            <button type="button" onClick={ajouterEnfant} className="ajouter__enfant">+ Ajouter un enfant</button>

            {erreurs && <pre style={{ color: "red" }}>{JSON.stringify(erreurs, null, 2)}</pre>}