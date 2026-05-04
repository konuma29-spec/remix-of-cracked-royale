import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TowerState {
  id: string;
  health: number;
  maxHealth: number;
}

interface ValidationRequest {
  battleId: string;
  eventType: 'tower_damage' | 'game_end' | 'card_placement';
  payload: {
    // tower_damage
    towerId?: string;
    damageAmount?: number;
    sourceCardId?: string;
    // game_end
    winnerId?: string | null;
    playerTowers?: TowerState[];
    enemyTowers?: TowerState[];
    timeRemaining?: number;
    // card_placement
    cardId?: string;
    elixirCost?: number;
    currentElixir?: number;
    position?: { x: number; y: number };
  };
}

// Card elixir costs for validation
const CARD_ELIXIR_COSTS: Record<string, number> = {
  'knight': 3, 'archers': 3, 'fireball': 4, 'giant': 5,
  'minions': 3, 'musketeer': 4, 'mini-pekka': 4, 'witch': 5,
  'valkyrie': 4, 'wizard': 5, 'hog-rider': 4, 'goblins': 2,
  'skeletons': 1, 'bomber': 3, 'baby-dragon': 4, 'prince': 5,
  'skeleton-army': 3, 'goblin-barrel': 3, 'rage': 2, 'balloon': 5,
  'pekka': 7, 'freeze': 4, 'arrows': 3, 'zap': 2,
  'poison': 4, 'lightning': 6, 'rocket': 6, 'tornado': 3,
  'goblin-hut': 5, 'tombstone': 3, 'inferno-tower': 5, 'bomb-tower': 4,
  'tesla': 4, 'x-bow': 6, 'mortar': 4, 'furnace': 4,
  'elixir-collector': 6, 'barbarian-hut': 7, 'cannon': 3,
  'golden-knight': 4, 'archer-queen': 5, 'skeleton-king': 4,
  'mighty-miner': 4, 'monk': 5, 'little-prince': 3,
};

const ARENA_WIDTH = 340;
const ARENA_HEIGHT = 500;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ valid: false, error: 'No authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ValidationRequest = await req.json();
    const { battleId, eventType, payload } = body;

    // Verify user is a participant in this battle
    const { data: battle, error: battleError } = await supabase
      .from('active_battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError || !battle) {
      return new Response(JSON.stringify({ valid: false, error: 'Battle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (battle.player1_id !== user.id && battle.player2_id !== user.id) {
      return new Response(JSON.stringify({ valid: false, error: 'Not a participant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isHost = battle.player1_id === user.id;

    let result: { valid: boolean; reason?: string };

    switch (eventType) {
      case 'card_placement': {
        const { cardId, elixirCost, currentElixir, position } = payload;
        
        if (!cardId || elixirCost === undefined || currentElixir === undefined || !position) {
          result = { valid: false, reason: 'Missing placement data' };
          break;
        }

        // Validate elixir cost matches known card cost
        const knownCost = CARD_ELIXIR_COSTS[cardId];
        if (knownCost !== undefined && knownCost !== elixirCost) {
          result = { valid: false, reason: `Elixir cost mismatch: expected ${knownCost}, got ${elixirCost}` };
          break;
        }

        // Validate player has enough elixir
        if (currentElixir < (knownCost || elixirCost)) {
          result = { valid: false, reason: 'Insufficient elixir' };
          break;
        }

        // Validate position is within arena bounds
        if (position.x < 0 || position.x > ARENA_WIDTH || position.y < 0 || position.y > ARENA_HEIGHT) {
          result = { valid: false, reason: 'Position out of bounds' };
          break;
        }

        result = { valid: true };
        break;
      }

      case 'tower_damage': {
        const { towerId, damageAmount, sourceCardId } = payload;
        
        if (!towerId || damageAmount === undefined) {
          result = { valid: false, reason: 'Missing tower damage data' };
          break;
        }

        // Only host can report tower damage
        if (!isHost) {
          result = { valid: false, reason: 'Only host can report tower damage' };
          break;
        }

        // Validate damage is within reasonable bounds (max single hit ~2000 for PEKKA)
        if (damageAmount < 0 || damageAmount > 3000) {
          result = { valid: false, reason: `Suspicious damage amount: ${damageAmount}` };
          break;
        }

        result = { valid: true };
        break;
      }

      case 'game_end': {
        const { winnerId, playerTowers, enemyTowers, timeRemaining } = payload;

        // Only host can report game end
        if (!isHost) {
          result = { valid: false, reason: 'Only host can report game end' };
          break;
        }

        if (!playerTowers || !enemyTowers) {
          result = { valid: false, reason: 'Missing tower state for game end validation' };
          break;
        }

        // Validate win condition
        const playerKingDead = playerTowers.some(t => t.id.includes('king') && t.health <= 0);
        const enemyKingDead = enemyTowers.some(t => t.id.includes('king') && t.health <= 0);
        const playerTowersDestroyed = playerTowers.filter(t => t.health <= 0).length;
        const enemyTowersDestroyed = enemyTowers.filter(t => t.health <= 0).length;
        const timeUp = timeRemaining !== undefined && timeRemaining <= 0;

        let expectedWinner: string | null = null;

        if (playerKingDead) {
          // Player's king died -> enemy wins -> winner is player2
          expectedWinner = battle.player2_id;
        } else if (enemyKingDead) {
          // Enemy's king died -> player wins -> winner is player1
          expectedWinner = battle.player1_id;
        } else if (timeUp) {
          // Time's up - compare crowns
          if (enemyTowersDestroyed > playerTowersDestroyed) {
            expectedWinner = battle.player1_id;
          } else if (playerTowersDestroyed > enemyTowersDestroyed) {
            expectedWinner = battle.player2_id;
          } else {
            expectedWinner = null; // Draw
          }
        }

        // Validate the reported winner matches our calculation
        if (winnerId !== expectedWinner) {
          console.warn(`Winner mismatch: reported=${winnerId}, calculated=${expectedWinner}`);
          // Use server-calculated winner (anti-cheat)
          await supabase
            .from('active_battles')
            .update({ 
              status: 'finished', 
              winner_id: expectedWinner 
            })
            .eq('id', battleId);
          
          result = { valid: false, reason: `Winner corrected to ${expectedWinner}` };
          break;
        }

        // Update battle with validated result
        await supabase
          .from('active_battles')
          .update({ 
            status: 'finished', 
            winner_id: expectedWinner 
          })
          .eq('id', battleId);

        result = { valid: true };
        break;
      }

      default:
        result = { valid: false, reason: `Unknown event type: ${eventType}` };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ valid: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
