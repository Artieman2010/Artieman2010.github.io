blockedSites = [];
loadBlockedSites(); // Load blocked sites when content script is loaded
checkForBlockedSites(); // Check for blocked sites when content script is loaded
//----------------------------------------GOOSE----------------------------------------

// Vector2 utility class
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static zero() { return new Vector2(0, 0); }

    static normalize(v) {
        const mag = Math.sqrt(v.x * v.x + v.y * v.y);
        return mag ? new Vector2(v.x / mag, v.y / mag) : Vector2.zero();
    }

    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    static distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static fromAngleDegrees(degrees) {
        const radians = degrees * Math.PI / 180;
        return new Vector2(Math.cos(radians), Math.sin(radians));
    }

    static Magnitude(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
}

// Time utility
const Time = {
    time: 0,
    deltaTime: 0,
    lastTime: 0,
    update() {
        const now = performance.now() / 1000;
        this.deltaTime = now - this.lastTime;
        this.time = now;
        this.lastTime = now;
    }
};

// GooseRig class
class GooseRig {
    constructor() {
        this.underbodyCenter = new Vector2();
        this.bodyCenter = new Vector2();
        this.neckCenter = new Vector2();
        this.neckBase = new Vector2();
        this.neckHeadPoint = new Vector2();
        this.head1EndPoint = new Vector2();
        this.head2EndPoint = new Vector2();
        this.neckLerpPercent = 0;
        this.targetBodyPos = new Vector2();
        this.smoothedBodyPos = new Vector2();
        this.bodyLerpSpeed = 3; // Reduced from 5 for smoother following
        this.targetRotation = 0;
        this.smoothedRotation = 0;
        this.bodyRotationSpeed = 1.8; // Reduced from 2.5 for slower body rotation
        this.rotationDamping = 0.92; // Increased from 0.85 for smoother rotation
    }
}

// Goose class
class Goose {
    constructor(test = false) {
        this.test = test;
        this.position = new Vector2(100, 100);
        this.velocity = Vector2.zero();
        this.direction = 90;
        this.targetPos = new Vector2(100, 150);
        this.targetDirection = 90; // Add this new property
        this.isEnabled = false;  // Add enabled state
        this.rotationSmoothing = 0.4; // Reduced from 0.6 for slower head turns
        this.lastVelocity = Vector2.zero(); // Add velocity history
        this.lastDirection = 90; // Add direction history
        this.isEscaping = false; // Add this new flag
        
        // Add new properties for shop features
        this.rainbowMode = false;
        this.armyMode = false;
        this.discoMode = false;
        this.miniGeese = [];
        this.rainbowColors = [
            '#ff0000', '#ff7f00', '#ffff00', 
            '#00ff00', '#0000ff', '#4b0082', '#8f00ff'
        ];
        this.rainbowIndex = 0;
        this.discoInterval = null;
        
        // Load shop state
        chrome.storage.local.get(['shopItems'], (result) => {
            if (result.shopItems) {
                this.rainbowMode = result.shopItems.rainbow.enabled;
                this.armyMode = result.shopItems.army.enabled;
                this.discoMode = result.shopItems.disco.enabled;
                
                if (this.armyMode) this.spawnMiniGeese();
                if (this.discoMode) this.startDiscoMode();
            }
        });

        // Listen for shop state changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.shopItems) {
                const newValues = changes.shopItems.newValue;
                this.rainbowMode = newValues.rainbow.enabled;
                this.armyMode = newValues.army.enabled;
                this.discoMode = newValues.disco.enabled;
                
                // Handle army mode changes
                if (this.armyMode && this.miniGeese.length === 0) {
                    this.spawnMiniGeese();
                } else if (!this.armyMode) {
                    this.miniGeese = [];
                }
                
                // Handle disco mode changes
                if (this.discoMode) {
                    this.startDiscoMode();
                } else {
                    this.stopDiscoMode();
                }
            }
        });
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '999999';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Initialize state
        this.currentSpeed = 50; // Reduced from 80
        this.currentAcceleration = 1300;
        this.stepTime = 0.2;
        this.changeDirectionDistance = 500; // Add this new property
        
        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame(() => this.update());
        this.pickNewTarget();

        this.gooseRig = new GooseRig();
        this.footMarks = Array(64).fill().map(() => ({ time: 0, position: new Vector2() }));
        this.footMarkIndex = 0;

        this.lFootPos = Vector2.zero();
        this.rFootPos = Vector2.zero();
        this.lFootMoveTimeStart = -1;
        this.rFootMoveTimeStart = -1;
        this.lFootMoveOrigin = Vector2.zero();
        this.rFootMoveOrigin = Vector2.zero();
        this.lFootMoveDir = Vector2.zero();
        this.rFootMoveDir = Vector2.zero();

        // If in test mode, set target to border
        if (this.test) {
            this.targetPos = new Vector2(window.innerWidth + 100, window.innerWidth);
            this.targetDirection = 0; // Run straight right
        }

        // Check initial state
        this.checkEnabled();
        
        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.isGooseEnabled) {
                this.checkEnabled();
            }
        });
    }

    checkEnabled() {
        chrome.storage.local.get(['isGooseEnabled'], (result) => {
            this.isEnabled = result.isGooseEnabled || false;
            if (!this.isEnabled) {
                // Clear canvas when disabled
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    pickNewTarget() {
        this.targetPos = new Vector2(
            Math.random() * (window.innerWidth - 100),
            Math.random() * (window.innerHeight - 100)
        );
        // Calculate direction without clamping
        const toTarget = this.targetPos.subtract(this.position);
        this.targetDirection = Math.atan2(toTarget.y, toTarget.x) * 180 / Math.PI;
    }

    getFootHome(rightFoot) {
        const rightMultiplier = rightFoot ? 1 : 0;
        const sideVector = Vector2.fromAngleDegrees(this.direction + 90);
        return this.position.add(sideVector.multiply(6 * rightMultiplier));
    }

    solveFeet() {
        const leftHome = this.getFootHome(false);
        const rightHome = this.getFootHome(true);

        // If no feet are moving, check if they need to move
        if (this.lFootMoveTimeStart < 0 && this.rFootMoveTimeStart < 0) {
            if (Vector2.distance(this.lFootPos, leftHome) > 5) {
                this.lFootMoveOrigin = this.lFootPos;
                this.lFootMoveDir = Vector2.normalize(leftHome.subtract(this.lFootPos));
                this.lFootMoveTimeStart = Time.time;
            } else if (Vector2.distance(this.rFootPos, rightHome) > 5) {
                this.rFootMoveOrigin = this.rFootPos;
                this.rFootMoveDir = Vector2.normalize(rightHome.subtract(this.rFootPos));
                this.rFootMoveTimeStart = Time.time;
            }
        }

        // Handle left foot movement
        if (this.lFootMoveTimeStart > 0) {
            const target = leftHome.add(this.lFootMoveDir.multiply(5 * 0.4));
            if (Time.time <= this.lFootMoveTimeStart + this.stepTime) {
                const t = (Time.time - this.lFootMoveTimeStart) / this.stepTime;
                this.lFootPos = Vector2.lerp(this.lFootMoveOrigin, target, this.cubicEaseInOut(t));
            } else {
                this.lFootPos = target;
                this.lFootMoveTimeStart = -1;
            }
        }

        // Handle right foot movement
        if (this.rFootMoveTimeStart > 0) {
            const target = rightHome.add(this.rFootMoveDir.multiply(5 * 0.4));
            if (Time.time <= this.rFootMoveTimeStart + this.stepTime) {
                const t = (Time.time - this.rFootMoveTimeStart) / this.stepTime;
                this.rFootPos = Vector2.lerp(this.rFootMoveOrigin, target, this.cubicEaseInOut(t));
            } else {
                this.rFootPos = target;
                this.rFootMoveTimeStart = -1;
            }
        }
    }

    cubicEaseInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    isNearBorder() {
        const margin = 50; // Distance from border to trigger center targeting
        return (
            this.position.x < margin ||
            this.position.x > window.innerWidth - margin ||
            this.position.y < margin ||
            this.position.y > window.innerHeight - margin
        );
    }

    handleBorderCollision() {
        const margin = 50;
        const pos = this.position;

        // Calculate rebound angles based on which border was hit
        if (pos.x < margin) {
            return { angle: 0, position: new Vector2(margin, pos.y) }; // Bounce right
        } else if (pos.x > window.innerWidth - margin) {
            return { angle: 180, position: new Vector2(window.innerWidth - margin, pos.y) }; // Bounce left
        } else if (pos.y < margin) {
            return { angle: 90, position: new Vector2(pos.x, margin) }; // Bounce down
        } else if (pos.y > window.innerHeight - margin) {
            return { angle: 270, position: new Vector2(pos.x, window.innerHeight - margin) }; // Bounce up
        }
        return null;
    }

    update() {
        if (!this.isEnabled) {
            requestAnimationFrame(() => this.update());
            return;
        }

        Time.update();
        
        // Only check border collisions if NOT escaping
        if (!this.isEscaping) {
            const collision = this.handleBorderCollision();
            if (collision) {
                this.position = collision.position;
                this.targetDirection = collision.angle;
                this.targetPos = this.position.add(Vector2.fromAngleDegrees(collision.angle).multiply(200));
            } else if (!this.test && 
                      (Vector2.distance(this.position, this.targetPos) < this.changeDirectionDistance )) {
                this.pickNewTarget();
            }
        }

        // Calculate direction difference in -180 to 180 range
        const targetDir = this.targetDirection;
        const currentDir = ((this.direction + 180) % 360) - 180;
        const directionDiff = ((targetDir - currentDir + 180) % 360) - 180;
        
        // Slower rotation speed with extra smoothing
        const rotationSpeed = 120; // Reduced from 180
        const maxRotation = rotationSpeed * Time.deltaTime;
        const rotation = Math.min(Math.abs(directionDiff), maxRotation) * Math.sign(directionDiff) * this.rotationSmoothing;
        
        // Smooth direction changes
        const smoothedRotation = rotation * 0.7; // Additional smoothing factor
        this.direction = ((currentDir + smoothedRotation + 180) % 360) - 180;
        this.lastDirection = this.direction;

        // Use direction for movement
        const directionRad = this.direction * Math.PI / 180;
        const normalized = new Vector2(Math.cos(directionRad), Math.sin(directionRad));
        
        // Smooth velocity transitions
        this.velocity = normalized.multiply(this.currentSpeed);
        this.velocity = Vector2.lerp(this.lastVelocity, this.velocity, Math.min(Time.deltaTime * 2, 0.15));
        this.lastVelocity = this.velocity;
        this.position = this.position.add(this.velocity.multiply(Time.deltaTime));

        this.solveFeet();
        
        // Draw
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();

        requestAnimationFrame(() => this.update());
    }

    updateRig() {
        const pos = this.position;
        const dir = this.direction;
        const up = new Vector2(0, -1);
        const dirVector = Vector2.fromAngleDegrees(dir);
        
        // Calculate target rotation based on movement
        if (Vector2.Magnitude(this.velocity) > 1) {
            this.gooseRig.targetRotation = Math.atan2(this.velocity.y, this.velocity.x) * 180 / Math.PI;
        }
        
        // Add extra smoothing for body rotation
        const rotationDiff = ((this.gooseRig.targetRotation - this.gooseRig.smoothedRotation + 180) % 360) - 180;
        const dampingFactor = Math.abs(rotationDiff) > 45 ? 0.4 : 0.92; // More damping on medium turns
        this.gooseRig.smoothedRotation += rotationDiff * 
            Math.min(Time.deltaTime * this.gooseRig.bodyRotationSpeed, 0.25) * 
            dampingFactor;
        
        // Calculate body offset based on rotation
        const bodyOffset = Vector2.fromAngleDegrees(this.gooseRig.smoothedRotation).multiply(10);
        
        // Apply rotated positions
        this.gooseRig.underbodyCenter = pos.subtract(bodyOffset).add(up.multiply(9));
        this.gooseRig.bodyCenter = pos.subtract(bodyOffset).add(up.multiply(14));
        
        // Calculate neck and head positions first
        const neckExtend = this.currentSpeed >= 200 ? 16 : 3;
        const upFactor = Math.abs(Math.sin(dir * Math.PI / 180));
        const neckHeight = this.currentSpeed >= 200 ? 10 : (20 * (0.5 + 0.5 * (1 - upFactor)));
        
        // Calculate target body position (following behind head)
        this.gooseRig.targetBodyPos = pos.subtract(dirVector.multiply(10));
        
        // Smoothly interpolate body position with damping
        const dt = Math.min(Time.deltaTime, 0.1); // Cap delta time to avoid large jumps
        this.gooseRig.smoothedBodyPos = Vector2.lerp(
            this.gooseRig.smoothedBodyPos,
            this.gooseRig.targetBodyPos,
            dt * this.gooseRig.bodyLerpSpeed * 0.75  // Added damping factor
        );
        
        // Use smoothed position for body
        this.gooseRig.underbodyCenter = this.gooseRig.smoothedBodyPos.add(up.multiply(9));
        this.gooseRig.bodyCenter = this.gooseRig.smoothedBodyPos.add(up.multiply(14));
        
        // Calculate neck and head positions relative to smoothed body
        this.gooseRig.neckBase = this.gooseRig.bodyCenter.add(dirVector.multiply(15));
        this.gooseRig.neckHeadPoint = this.gooseRig.neckBase
            .add(dirVector.multiply(neckExtend))
            .add(up.multiply(neckHeight));
        this.gooseRig.head1EndPoint = this.gooseRig.neckHeadPoint
            .add(dirVector.multiply(3))
            .add(up.multiply(-1));
        this.gooseRig.head2EndPoint = this.gooseRig.head1EndPoint
            .add(dirVector.multiply(5));
    }

    draw() {
        if (!this.isEnabled) return;
        const ctx = this.ctx;
        this.updateRig();
        
        // Draw rainbow trail if enabled 
        if (this.rainbowMode) {
            // Slow down color changes and make trail longer
            if (Time.time % 0.5 < Time.deltaTime) { // Only change color every 0.5 seconds
                this.rainbowIndex = (this.rainbowIndex + 1) % this.rainbowColors.length;
            }
            
            // Draw trail from behind the goose
            ctx.strokeStyle = this.rainbowColors[this.rainbowIndex];
            ctx.lineWidth = 24; // Increased from 8 to 24
            ctx.beginPath();
            
            // Start trail from back of goose body
            const trailStart = this.gooseRig.bodyCenter.subtract(
                Vector2.fromAngleDegrees(this.direction).multiply(20)
            );
            
            ctx.moveTo(trailStart.x, trailStart.y);
            // Make trail longer
            ctx.lineTo(
                trailStart.x - this.velocity.x * 0.5, 
                trailStart.y - this.velocity.y * 0.5
            );
            ctx.stroke();
        }

        // Draw shadow first (unrotated) - adjusted position to be under the body
        ctx.fillStyle = 'rgba(169,169,169,0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.gooseRig.underbodyCenter.x, 
            this.gooseRig.underbodyCenter.y + 5, // Offset down from underbody
            25, 18, // Increased from 20,15 to 30,22
            this.gooseRig.smoothedRotation * Math.PI / 180, // Match body rotation
            0, Math.PI * 2
        );
        ctx.fill();

        // Draw grey parts first
        ctx.strokeStyle = 'rgb(211,211,211)';
        ctx.lineWidth = 24;
        ctx.lineCap = 'round';

        // Save context before rotating
        ctx.save();

        // Rotate around body center
        ctx.translate(this.gooseRig.bodyCenter.x, this.gooseRig.bodyCenter.y);
        ctx.rotate(this.gooseRig.smoothedRotation * Math.PI / 180);
        ctx.translate(-this.gooseRig.bodyCenter.x, -this.gooseRig.bodyCenter.y);

        // Grey underbody (now rotated)
        ctx.beginPath();
        // Calculate a dynamic offset based on body position
        // Get orientation in 0-360 range
        const orientation = (this.gooseRig.smoothedRotation % 360 + 360) % 360;
        // Calculate y offset based on orientation
        const yOffset = (orientation > 90 && orientation < 270) ? -10 : 0;

        ctx.moveTo(this.gooseRig.underbodyCenter.x - 7, 
                   this.gooseRig.underbodyCenter.y + yOffset);
        ctx.lineTo(this.gooseRig.underbodyCenter.x + 7, 
                   this.gooseRig.underbodyCenter.y + yOffset);
        ctx.stroke();

        // Restore context to draw feet unrotated
        ctx.restore();

        // Draw feet
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.lFootPos.x, this.lFootPos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.rFootPos.x, this.rFootPos.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Save context again for rotated body
        ctx.save();
        ctx.translate(this.gooseRig.bodyCenter.x, this.gooseRig.bodyCenter.y);
        ctx.rotate(this.gooseRig.smoothedRotation * Math.PI / 180);
        ctx.translate(-this.gooseRig.bodyCenter.x, -this.gooseRig.bodyCenter.y);

        // Grey body
        ctx.strokeStyle = 'rgb(211,211,211)';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.moveTo(this.gooseRig.bodyCenter.x - 11, this.gooseRig.bodyCenter.y);
        ctx.lineTo(this.gooseRig.bodyCenter.x + 11, this.gooseRig.bodyCenter.y);
        ctx.stroke();

        // Draw white body
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(this.gooseRig.bodyCenter.x - 11, this.gooseRig.bodyCenter.y);
        ctx.lineTo(this.gooseRig.bodyCenter.x + 11, this.gooseRig.bodyCenter.y);
        ctx.stroke();

        // Restore context for unrotated parts
        ctx.restore();

        // Rest of drawing remains the same
        const dirVec = Vector2.fromAngleDegrees(this.direction);
        const upVec = new Vector2(0, -1);

        // Draw neck and head
        ctx.strokeStyle = 'rgb(211,211,211)';
        ctx.lineWidth = 24 * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.gooseRig.neckBase.x, this.gooseRig.neckBase.y);

        const cp1 = this.gooseRig.neckBase.add(dirVec.multiply(15));
        const cp2 = this.gooseRig.neckHeadPoint.add(dirVec.multiply(-5)).add(upVec.multiply(5));
        const cp3 = this.gooseRig.neckHeadPoint.add(dirVec.multiply(5));
        const cp4 = this.gooseRig.head1EndPoint.add(dirVec.multiply(-2));

        ctx.bezierCurveTo(
            cp1.x, cp1.y,
            cp2.x, cp2.y,
            this.gooseRig.neckHeadPoint.x, this.gooseRig.neckHeadPoint.y
        );
        ctx.bezierCurveTo(
            cp3.x, cp3.y,
            cp4.x, cp4.y,
            this.gooseRig.head1EndPoint.x, this.gooseRig.head1EndPoint.y
        );
        ctx.lineTo(this.gooseRig.head2EndPoint.x, this.gooseRig.head2EndPoint.y);
        ctx.stroke();

        // Draw white neck and head
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 22 * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.gooseRig.neckBase.x, this.gooseRig.neckBase.y);
        ctx.bezierCurveTo(
            cp1.x, cp1.y,
            cp2.x, cp2.y,
            this.gooseRig.neckHeadPoint.x, this.gooseRig.neckHeadPoint.y
        );
        ctx.bezierCurveTo(
            cp3.x, cp3.y,
            cp4.x, cp4.y,
            this.gooseRig.head1EndPoint.x, this.gooseRig.head1EndPoint.y
        );
        ctx.lineTo(this.gooseRig.head2EndPoint.x, this.gooseRig.head2EndPoint.y);
        ctx.stroke();

        // Draw beak
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(this.gooseRig.head2EndPoint.x, this.gooseRig.head2EndPoint.y);
        ctx.lineTo(this.gooseRig.head2EndPoint.x + dirVec.x * 3,
                  this.gooseRig.head2EndPoint.y + dirVec.y * 3);
        ctx.stroke();

        // Draw eyes
        ctx.fillStyle = 'black';
        const rightVec = Vector2.fromAngleDegrees(this.direction + 90);
        const eyePos = this.gooseRig.neckHeadPoint.add(new Vector2(0, -3));

        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.arc(
                eyePos.x + rightVec.x * 2.5 * side + dirVec.x * 5,
                eyePos.y + rightVec.y * 2.5 * side + dirVec.y * 5,
                2, 0, Math.PI * 2
            );
            ctx.fill();
        });

        // Draw mini geese if army mode is enabled 
        if (this.armyMode) {
            const ctx = this.ctx;
            this.miniGeese.forEach((miniGoose, index) => {
                // Update mini goose position to follow in V formation
                const angle = index % 2 === 0 ? 30 : -30; // Alternate sides
                const distance = (Math.floor(index/2) + 1) * 40; // Stagger distance
                const offset = Vector2.fromAngleDegrees(this.direction + angle).multiply(distance);
                
                const targetPos = this.position.subtract(offset);
                miniGoose.position = Vector2.lerp(
                    miniGoose.position,
                    targetPos, 
                    Math.min(Time.deltaTime * 3, 1)
                );
                
                // Save context
                ctx.save();
                
                // Move to mini goose position and scale
                ctx.translate(miniGoose.position.x, miniGoose.position.y);
                ctx.scale(0.5, 0.5);
                ctx.translate(-miniGoose.position.x, -miniGoose.position.y);
                
                // Draw simplified mini goose
                const miniRig = new GooseRig();
                miniRig.bodyCenter = miniGoose.position;
                miniRig.underbodyCenter = miniGoose.position.add(new Vector2(0, 5));
                miniRig.neckBase = miniGoose.position.add(Vector2.fromAngleDegrees(this.direction).multiply(10));
                
                // Draw grey outline for body
                ctx.strokeStyle = 'rgb(211,211,211)';
                ctx.lineWidth = 14;
                ctx.beginPath();
                ctx.arc(miniGoose.position.x, miniGoose.position.y, 12, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw white body fill
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(miniGoose.position.x, miniGoose.position.y, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw grey outline for neck with shorter length for mini geese
                ctx.strokeStyle = 'rgb(211,211,211)';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(miniRig.neckBase.x, miniRig.neckBase.y);
                const neckEnd = miniRig.neckBase.add(
                    Vector2.fromAngleDegrees(this.direction).multiply(8) // Reduced from 15 to 8
                );
                ctx.lineTo(neckEnd.x, neckEnd.y);
                ctx.stroke();
                
                // Draw white neck
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(miniRig.neckBase.x, miniRig.neckBase.y);
                ctx.lineTo(neckEnd.x, neckEnd.y);
                ctx.stroke();
                
                // Draw grey outline for head
                ctx.strokeStyle = 'rgb(211,211,211)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(neckEnd.x, neckEnd.y, 6, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw white head fill
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(neckEnd.x, neckEnd.y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw black eyes
                ctx.fillStyle = 'black';
                const eyeOffset = Vector2.fromAngleDegrees(this.direction + 90).multiply(2);
                [-1, 1].forEach(side => {
                    ctx.beginPath();
                    ctx.arc(
                        neckEnd.x + eyeOffset.x * side + Vector2.fromAngleDegrees(this.direction).x * 3,
                        neckEnd.y + eyeOffset.y * side + Vector2.fromAngleDegrees(this.direction).y * 3,
                        1, 0, Math.PI * 2
                    );
                    ctx.fill();
                });
                
                // Draw orange beak
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(neckEnd.x, neckEnd.y);
                const beakEnd = neckEnd.add(
                    Vector2.fromAngleDegrees(this.direction).multiply(8)
                );
                ctx.lineTo(beakEnd.x, beakEnd.y);
                ctx.stroke();
                
                ctx.restore();
            });
        }
    }

    spawnMiniGeese() {
        // Create 3 mini geese that follow the main goose
        for (let i = 0; i < 3; i++) {
            this.miniGeese.push({
                position: new Vector2(
                    this.position.x - (i + 1) * 30,
                    this.position.y - (i + 1) * 30
                ),
                scale: 0.5
            });
        }
    }

    startDiscoMode() {
        if (this.discoInterval) return;
        
        this.discoInterval = setInterval(() => {
            document.body.style.backgroundColor = this.rainbowColors[
                Math.floor(Math.random() * this.rainbowColors.length)
            ];
        }, 500);
    }

    stopDiscoMode() {
        if (this.discoInterval) {
            clearInterval(this.discoInterval);
            this.discoInterval = null;
            document.body.style.backgroundColor = '';
        }
    }

    destroy() {
        // ...existing destroy code...
        this.stopDiscoMode();
    }
}

// Initialize goose with test mode
const goose = new Goose(false); // Set to false for normal mode


const defaultMemes = [
    'memes/Meme1.png', 'memes/Meme2.png', 'memes/Meme3.png', 
    'memes/Meme5.png', 'memes/Meme6.png', 'memes/Meme7.png', 'memes/GooseDance.gif'
];
// Ensure defaultMemes are included in customMemes
chrome.storage.local.get(['customMemes'], (result) => {
    if (!result.customMemes) {
        chrome.storage.local.set({ customMemes: defaultMemes });
    }
});


let memes = [...defaultMemes];
// -----------------------------------BLOCKED SITES MOSTLY-----------------------------------

chrome.storage.local.get(['customMemes'], (result) => {
    if (result.customMemes) {
        memes = result.customMemes;
    }
});


// Function to load the blocked sites from chrome.storage
function loadBlockedSites() {
    chrome.storage.local.get(["blockedSites"], (result) => {
        blockedSites = result.blockedSites || [];
    });
}


// Listen for changes to blockedSites in chrome.storage.local
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.blockedSites) {
        loadBlockedSites(); // Reload blocked sites when they change
    }
});


// Function to check if the current URL contains any blocked site
function checkForBlockedSites() {
    const currentURL = window.location.href.toLowerCase();

    // Loop through the blocked sites and check if any match the current URL
    blockedSites.forEach(site => {
        if (currentURL.includes(site.name.toLowerCase())) {
            // Check if goose is enabled
            chrome.storage.local.get(['isGooseEnabled'], (result) => {
                if (!result.isGooseEnabled) {
                    // Direct redirect if goose is disabled
                    window.location.href = chrome.runtime.getURL("block.html");
                } else {
                    // Normal escape sequence if goose is enabled
                    initiateEscapeSequence();
                }
            });
        }
    });
}

function initiateEscapeSequence() {
    let door = document.querySelector('img[src*="door.gif"]');
    if (!door) {
        door = document.createElement('img');
        door.src = chrome.runtime.getURL('door.gif');
        door.style.cssText = 'position: fixed; z-index: 9997; width: 150px; pointer-events: none;';
        
        // Random position with margins
        const margin = 350;
        const doorX = margin + Math.random() * (window.innerWidth - (2 * margin));
        const doorY = margin + Math.random() * (window.innerHeight - (2 * margin));
        door.style.left = `${doorX}px`;
        door.style.top = `${doorY}px`;
        
        document.body.appendChild(door);
        
        // Configure goose for escape sequence
        goose.isEscaping = true;
        goose.currentSpeed = 300;
        
        // Set target position to the center of the door
        const doorCenter = new Vector2(doorX + 50, doorY + 50);
        goose.targetPos = doorCenter;
        
        // Update direction calculation to look exactly at target
        const updateGooseDirection = () => {
            const toTarget = doorCenter.subtract(goose.position);
            const angleToTarget = (Math.atan2(toTarget.y, toTarget.x) * 180 / Math.PI);
            goose.targetDirection = angleToTarget;
            
            if (Vector2.distance(goose.position, doorCenter) >= 90) {
                requestAnimationFrame(updateGooseDirection);
            }
        };
        
        updateGooseDirection();
        
        const checkDistance = setInterval(() => {
            if (!door) {
                clearInterval(checkDistance);
                return;
            }
            const distance = Math.abs(goose.position.x - doorCenter.x);
            if (distance < 90) {
                clearInterval(checkDistance);
                goose.isEscaping = false;
                
                // Create a smooth transition
                const fadeOut = () => {
                    // Start redirect and cleanup only after fade completes
                    window.location.href = chrome.runtime.getURL("block.html");
                };
                
                // Add fade-out class to door
                door.style.transition = 'opacity 0.3s ease-out';
                door.style.opacity = '0';
                
                // Wait for transition to complete before redirect
                setTimeout(fadeOut, 100);
            }
        }, 45);
    }
}


// Set an interval to check for blocked sites every 100ms
setInterval(checkForBlockedSites, 100);



//----------------------------------------MEMES----------------------------------------
function showRandomMeme() {
    try {
        if (!chrome.runtime.id) {
            console.log('Extension context invalid, skipping meme display');
            return;
        }
    } catch {
        console.log('Extension context invalid, skipping meme display');
        return;
    }

    // First refresh the meme list from storage
    chrome.storage.local.get(['customMemes'], (result) => {
        if (result.customMemes) {
            memes = result.customMemes;
        } else {
    
            memes = [...defaultMemes];
        }

        // Then proceed with showing the meme
        chrome.storage.local.get(['isGooseEnabled', 'isMemesEnabled', 'isSoundEnabled'], (result) => {
            if (!result.isGooseEnabled) {
                return;
            }
            if (result.isMemesEnabled) {
                try {
                    if (memes.length > 0) {
                        try{
                        // Check if the tab is active before playing sound
                        if (result.isSoundEnabled && !document.hidden) {
                            const honkAudio = new Audio(chrome.runtime.getURL('Honk4.mp3'));
                            honkAudio.play().catch((error) => {
                                console.error('Error playing sound:', error);
                            });
                        }
                    } catch  {}
                        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
                        const memeElement = document.createElement('img');
                        memeElement.src = randomMeme.startsWith('data:')
                            ? randomMeme
                            : chrome.runtime.getURL(randomMeme);
                        memeElement.style.cssText = `position: fixed; z-index: 9998; width: 200px; left: ${goose.gooseRig.bodyCenter.x}px; top: ${goose.gooseRig.bodyCenter.y}px;`;
                        document.body.appendChild(memeElement);
                        setTimeout(() => memeElement.remove(), 5000);
                    }
                } catch (error) {
                    console.log('Extension context error:', error);
                }
            }
        });
    });
}


// Start meme display interval
let memeIntervalId = null;
let result123456 = 0;
function updateMemeInterval() {
    chrome.storage.local.get(['memeInterval'], (result) => {
        if (result123456 === result.memeInterval) {
            return;
        }
        const memeInterval = result.memeInterval || 300000; // Default to 15000ms if not set
        if (memeIntervalId) {
            clearInterval(memeIntervalId);
        }
        memeIntervalId = setInterval(showRandomMeme, memeInterval);
        result123456 = result.memeInterval;
    });
}


// Initial call to set the interval
updateMemeInterval();


// Listen for changes to memeInterval and update the interval accordingly
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.memeInterval) {
        updateMemeInterval();
    }
});


// Check if sound is enabled and play footsteps audio if true
let footstepsAudio = null;


/*function playFootstepsAudio() {
    if (!chrome.runtime.id) {
        console.log('Extension context invalid, skipping sound');
        return; // Extension context invalid, skip playing sound
    }
    chrome.storage.local.get(['isSoundEnabled'], (result) => {
        if (result.isSoundEnabled) {
            if (!footstepsAudio) {
                footstepsAudio = new Audio(chrome.runtime.getURL('pat.wav'));
                footstepsAudio.play();
                footstepsAudio.addEventListener('ended', () => {
                    setTimeout(() => {
                        footstepsAudio.play();
                    }, 200); // 0.2 seconds delay between each pat
                });
            }
        } else if (footstepsAudio) {
            footstepsAudio.pause();
            footstepsAudio.currentTime = 0;
            footstepsAudio = null;
        }
    });
}*/


// Set interval to check sound state every second
//setInterval(playFootstepsAudio, 1000);

// © 2025 Putnam Land Company, LLC. All rights reserved.
class GoalDisplay {
    static attachGoalToGoose(goals) {
        const goalsContainer = document.createElement('div');
        goalsContainer.className = 'goose-goals-container';
        goalsContainer.style.cssText = `
            position: fixed;
            z-index: 9996;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 250px;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            font-size: 14px !important;
            font-family: Arial, sans-serif !important;
            line-height: 1.4 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            border: none !important;
            text-align: left !important;
            color: #000 !important;
        `;
        document.body.appendChild(goalsContainer);

        const goalsWrapper = document.createElement('div');
        goalsWrapper.className = 'goals-wrapper';
        goalsWrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            box-sizing: border-box !important;
        `;
        goalsContainer.appendChild(goalsWrapper);

        let remainingGoals = goals.length;

        goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goose-goal';
            goalElement.style.cssText = `
                background: white;
                border: 2px solid #3498db !important;
                border-radius: 8px;
                padding: 8px !important;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                font-size: 14px !important;
                font-family: Arial, sans-serif !important;
                line-height: 1.4 !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                width: 100% !important;
                min-height: auto !important;
                max-height: none !important;
                transition: opacity 0.3s ease;
            `;

            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.style.cssText = `
                position: relative;
                width: 24px !important;
                height: 24px !important;
                min-width: 24px !important;
                min-height: 24px !important;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                margin: 0 !important;
                padding: 0 !important;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.cssText = `
                width: 16px !important;
                height: 16px !important;
                min-width: 16px !important;
                min-height: 16px !important;
                margin: 0 !important;
                padding: 0 !important;
                cursor: pointer;
                position: relative;
                z-index: 1;
                appearance: auto !important;
                -webkit-appearance: auto !important;
            `;

            // Add click handler to wrapper
            checkboxWrapper.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    chrome.storage.local.get(['goals'], (result) => {
                        const updatedGoals = (result.goals || []).filter(g => g.id !== goal.id);
                        chrome.storage.local.set({ goals: updatedGoals }, () => {
                            goalElement.style.opacity = '0';
                            setTimeout(() => {
                                goalElement.remove();
                                remainingGoals--;
                                if (remainingGoals === 0) {
                                    goalsContainer.style.opacity = '0';
                                    setTimeout(() => goalsContainer.remove(), 300);
                                }
                            }, 300);
                        });
                    });
                }
            });

            checkboxWrapper.appendChild(checkbox);
            goalElement.appendChild(checkboxWrapper);

            const text = document.createElement('span');
            text.style.cssText = `
                font-size: 14px !important;
                font-family: Arial, sans-serif !important;
                line-height: 1.4 !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
                flex: 1;
                white-space: normal;
                word-break: break-word;
            `;
            text.textContent = goal.content;
            goalElement.appendChild(text);
            goalsWrapper.appendChild(goalElement);

            // Update automatic removal timer
            setTimeout(() => {
                goalElement.style.opacity = '0';
                setTimeout(() => {
                    goalElement.remove();
                    remainingGoals--;
                    if (remainingGoals === 0) {
                        goalsContainer.style.opacity = '0';
                        setTimeout(() => goalsContainer.remove(), 300);
                    }
                }, 300);
            }, 5000);  // Each goal lasts 5 seconds
        });

        // Add a backup cleanup timer
        setTimeout(() => {
            if (goalsContainer.parentNode) {
                goalsContainer.style.opacity = '0';
                setTimeout(() => goalsContainer.remove(), 300);
            }
        }, 5500);

        const updatePosition = () => {
            if (!goose.isEnabled) {
                goalsContainer.remove();
                return;
            }

            const angle = goose.direction * Math.PI / 180;
            const distance = 60;
            const x = goose.position.x - Math.cos(angle) * distance;
            const y = goose.position.y - Math.sin(angle) * distance;

            goalsContainer.style.left = `${x}px`;
            goalsContainer.style.top = `${y}px`;

            requestAnimationFrame(updatePosition);
        };

        updatePosition();

        // Remove the automatic container timeout since goals have individual timeouts
        // The container will be removed when all goals are gone
    }

    static checkGoals() {
        chrome.storage.local.get(['goals', 'isGooseEnabled'], (result) => {
            if (!result.isGooseEnabled || !result.goals) return;

            const now = Date.now();
            const goals = result.goals;

            // Group goals by interval
            const intervalGroups = {};
            goals.forEach(goal => {
                const interval = parseInt(goal.interval);
                if (!intervalGroups[interval]) {
                    intervalGroups[interval] = {
                        goals: [],
                        lastShown: 0
                    };
                }
                intervalGroups[interval].goals.push(goal);
                // Update group's lastShown time to the most recent one
                intervalGroups[interval].lastShown = Math.max(
                    intervalGroups[interval].lastShown,
                    goal.lastShown || 0
                );
            });

            // Check each interval group
            Object.entries(intervalGroups).forEach(([interval, group]) => {
                const baseInterval = parseInt(interval) * 1000;
                const randomOffset = (Math.random() * 6000) - 3000; // ±3 seconds
                const effectiveInterval = baseInterval + randomOffset;

                // Check if the group should be shown
                if (now - group.lastShown >= effectiveInterval) {
                    // Show all goals in this group together
                    GoalDisplay.attachGoalToGoose(group.goals);
                    
                    // Update lastShown for all goals in this group
                    const newLastShown = now;
                    group.goals.forEach(goal => {
                        goal.lastShown = newLastShown;
                    });
                    
                    chrome.storage.local.set({ goals });
                }
            });
        });
    }
}

// Add interval to check goals
setInterval(() => GoalDisplay.checkGoals(), 1000);

