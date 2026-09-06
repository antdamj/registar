export default function MemberView({ member }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Moj profil</h2>
      <p><strong>Ime:</strong> {member.firstName} {member.lastName}</p>
      <p><strong>OIB:</strong> {member.oib}</p>
      <p><strong>E-mail pri udruzi:</strong> {member.associationEmail}</p>
      <p><strong>Rola:</strong> {member.appRole}</p>
      <p><strong>Matična sekcija:</strong> {member.homeSection?.name}</p>
      <p><em>Uređivanje profila dolazi u sljedećem koraku.</em></p>
    </div>
  );
}
