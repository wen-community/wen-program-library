use crate::{errors::EditionsControlsError, EditionsControls, MinterStats, Phase};
use anchor_lang::{accounts::account::Account, prelude::*};

pub fn check_phase_constraints(
    phase: &Phase,
    minter_stats: &mut Account<MinterStats>,
    minter_stats_phase: &mut Account<MinterStats>,
    editions_controls: &Account<EditionsControls>,
) -> Result<()> {
    let clock = Clock::get().unwrap();
    let current_time = clock.unix_timestamp;

    if !phase.active {
        return Err(EditionsControlsError::PhaseNotActive.into());
    }

    if phase.start_time > current_time {
        return Err(EditionsControlsError::PhaseNotStarted.into());
    }

    if phase.end_time <= current_time {
        return Err(EditionsControlsError::PhaseAlreadyFinished.into());
    }

    /// Checks if the total mints for the phase has been exceeded (phase sold out)
    /// @dev dev: notice that if max_mints_total is 0, this constraint is disabled
    if phase.max_mints_total > 0 && phase.current_mints >= phase.max_mints_total {
        return Err(EditionsControlsError::ExceededMaxMintsForPhase.into());
    }

    /// Checks if the user has exceeded the max mints for the deployment (across all phases!)
    /// dev: notice that if max_mints_per_wallet is 0, this constraint is disabled
    if editions_controls.max_mints_per_wallet > 0
        && minter_stats.mint_count >= editions_controls.max_mints_per_wallet
    {
        return Err(EditionsControlsError::ExceededWalletMaxMintsForCollection.into());
    }

    /// Checks if the user has exceeded the max mints for the current phase
    /// dev: notice that if max_mints_per_wallet is 0, this constraint is disabled
    if phase.max_mints_per_wallet > 0 && minter_stats_phase.mint_count >= phase.max_mints_per_wallet
    {
        return Err(EditionsControlsError::ExceededWalletMaxMintsForPhase.into());
    }

    Ok(())
}
