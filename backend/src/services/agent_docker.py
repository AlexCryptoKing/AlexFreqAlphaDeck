"""
Docker Controller for Agent - NON-BLOCKING VERSION
Uses asyncio subprocess (doesn't block backend)
"""
import asyncio
import subprocess
import os
import logging
import time
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

AGENT_PATH = "/opt/Freqtradeagent"
AGENT_IMAGE = "freqtradeorg/freqtrade:stable"

class AgentDockerController:
    """Non-blocking Docker controller using asyncio"""
    
    @staticmethod
    async def is_container_running() -> bool:
        """Check if freqtrade-agent container is running (async)"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "ps", "-q", "-f", "name=freqtrade-agent",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            return len(stdout.decode().strip()) > 0
        except Exception as e:
            logger.error(f"Failed to check container status: {e}")
            return False
    
    @staticmethod
    async def start_container() -> Tuple[bool, str]:
        """Start the Freqtrade Agent container (async)"""
        try:
            if await AgentDockerController.is_container_running():
                return True, "Container already running"
            
            cmd = [
                "docker", "run", "-d", "--name", "freqtrade-agent",
                "--restart", "unless-stopped", "-p", "8060:8060",
                "-v", f"{AGENT_PATH}/user_data/config:/freqtrade/user_data/config",
                "-v", f"{AGENT_PATH}/user_data/strategies:/freqtrade/user_data/strategies",
                "-v", "/opt/Freqtrade_data/data:/freqtrade/user_data/data",
                "-v", f"{AGENT_PATH}/user_data/logs:/freqtrade/user_data/logs",
                "-v", f"{AGENT_PATH}/user_data/backtest_results:/freqtrade/user_data/backtest_results",
                "-v", f"{AGENT_PATH}/user_data/hyperopt_results:/freqtrade/user_data/hyperopt_results",
                "-e", "TZ=Europe/Vienna", AGENT_IMAGE,
                "trade", "--db-url", "sqlite:////freqtrade/user_data/tradesv3.sqlite",
                "--strategy", "Alex_AgentStrategy",
                "--config", "/freqtrade/user_data/config/config-torch.json"
            ]
            
            logger.info(f"Starting Agent container: {' '.join(cmd)}")
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
            except asyncio.TimeoutError:
                return False, "Timeout starting container"
            
            if proc.returncode == 0:
                container_id = stdout.decode().strip()
                logger.info(f"Agent container started: {container_id[:12]}")
                return True, f"Container started: {container_id[:12]}"
            else:
                err = stderr.decode()
                logger.error(f"Failed to start container: {err}")
                return False, err
                
        except Exception as e:
            logger.error(f"Exception starting container: {e}")
            return False, str(e)
    
    @staticmethod
    async def stop_container() -> Tuple[bool, str]:
        """Stop and remove the Freqtrade Agent container (async)"""
        try:
            # Stop
            stop_proc = await asyncio.create_subprocess_exec(
                "docker", "stop", "freqtrade-agent",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            try:
                await asyncio.wait_for(stop_proc.communicate(), timeout=30)
            except asyncio.TimeoutError:
                pass
            
            # Remove
            rm_proc = await asyncio.create_subprocess_exec(
                "docker", "rm", "freqtrade-agent",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            try:
                await asyncio.wait_for(rm_proc.communicate(), timeout=30)
            except asyncio.TimeoutError:
                pass
            
            logger.info("Agent container stopped and removed")
            return True, "Container stopped"
            
        except Exception as e:
            logger.error(f"Exception stopping container: {e}")
            return False, str(e)
    
    @staticmethod
    async def get_container_logs(lines: int = 50) -> str:
        """Get recent container logs (async)"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "logs", "--tail", str(lines), "freqtrade-agent",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            return stdout.decode() if proc.returncode == 0 else "Error getting logs"
        except Exception as e:
            return f"Error getting logs: {e}"
    
    @staticmethod
    async def restart_container() -> Tuple[bool, str]:
        """Restart the Freqtrade Agent container (async)"""
        stop_success, stop_msg = await AgentDockerController.stop_container()
        if not stop_success:
            return False, f"Failed to stop: {stop_msg}"
        
        await asyncio.sleep(2)
        return await AgentDockerController.start_container()

# ============================================================================
# BACKWARDS COMPATIBILITY WRAPPERS (if needed)
# ============================================================================

def run_async(func):
    """Helper to run async function from sync code"""
    return asyncio.run(func)
