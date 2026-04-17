import { useStore, calculateTotalScore } from '../../store';

export function Results() {
  const { players, playerFrames, resetGame, gameMode, totalRounds } = useStore();

  const playerScores = players.map(p => ({
    player: p,
    score: calculateTotalScore(playerFrames[p.id] || [], totalRounds)
  })).sort((a, b) => b.score - a.score);

  const winner = playerScores[0]?.player;
  const winnerScore = playerScores[0]?.score || 0;
  
  const totalScore = playerScores.reduce((sum, p) => sum + p.score, 0);
  const averageScore = players.length > 0 ? Math.round(totalScore / players.length) : 0;

  const exportCSV = () => {
    let csvContent = '';
    
    if (gameMode === 'single') {
      const headers = ['Player', ...Array.from({ length: totalRounds }, (_, i) => `Round ${i + 1}`), 'Total Score'];
      const p = players[0];
      const frames = playerFrames[p?.id] || [];
      const frameScores = frames.map(f => f.score !== null ? f.score.toString() : '0');
      
      const rows = [[p?.name || 'Player', ...frameScores, winnerScore]];
      csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      const headers = ['Rank', 'Player', ...Array.from({ length: totalRounds }, (_, i) => `Round ${i + 1}`), 'Total Score'];
      const rows = playerScores.map((ps, index) => {
        const frames = playerFrames[ps.player.id] || [];
        const frameScores = frames.map(f => f.score !== null ? f.score.toString() : '0');
        return [index + 1, ps.player.name, ...frameScores, ps.score];
      });

      csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', gameMode === 'single' ? 'single_player_results.csv' : 'class_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#002244] text-white p-8 overflow-y-auto">
      <h2 className="text-6xl font-black tracking-tight mb-8 text-[#ffbb00] drop-shadow-[0_0_20px_rgba(255,187,0,0.4)]">
        {gameMode === 'single' ? 'Game Over!' : 'Tournament Complete!'}
      </h2>
      
      <div className="bg-[#114466] p-12 rounded border-l-4 border-accent shadow-2xl mb-12 text-center flex flex-col items-center gap-4">
        <h3 className="text-3xl font-bold text-white/70 uppercase tracking-[2px]">
          {gameMode === 'single' ? 'Final Score' : 'Grand Champion'}
        </h3>
        <p className="text-7xl font-black text-white drop-shadow-md">
          {gameMode === 'single' ? winnerScore : (winner?.name || 'Unknown')}
        </p>
        {gameMode === 'class' && (
          <>
            <p className="text-3xl font-bold text-accent mt-4">Score: {winnerScore}</p>
            <div className="mt-8 pt-8 border-t border-white/20 w-full">
              <h4 className="text-xl text-white/70 uppercase tracking-wider mb-2">Class Average</h4>
              <p className="text-5xl font-black text-white">{averageScore}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-6">
        <button 
          onClick={exportCSV}
          className="px-8 py-4 bg-accent text-[#002244] hover:bg-white rounded font-bold text-2xl transition-colors shadow-lg"
        >
          Export CSV
        </button>
        <button 
          onClick={resetGame}
          className="px-8 py-4 bg-[#114466] border border-white/10 hover:bg-[#115588] rounded font-bold text-2xl transition-colors shadow-lg"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
