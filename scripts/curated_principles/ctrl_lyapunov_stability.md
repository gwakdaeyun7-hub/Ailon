---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 리아푸노프 안정성, 에너지 함수, 수렴 보장, 안전 제약, 제어 리아푸노프 함수, 신경 리아푸노프 함수
keywords_en: Lyapunov stability, energy function, convergence guarantee, safety constraint, control Lyapunov function, neural Lyapunov function
---
Lyapunov Stability Theory - 시스템의 에너지가 감소하면 안정적이라는 직관으로 미분방정식을 풀지 않고 안정성을 판별하는 방법

## 안정성이란 무엇인가

그릇 안에 놓인 공을 상상해 보자. 공을 옆으로 살짝 밀면 벽을 따라 흔들리다가 결국 바닥으로 돌아온다. 이것이 **안정(stable)** 시스템이다. 이제 그릇을 뒤집어 놓고 꼭대기에 공을 올려 보자. 아주 작은 바람에도 공은 굴러 떨어지고, 다시는 원래 위치로 돌아오지 않는다. 이것이 **불안정(unstable)** 시스템이다.

제어 이론에서는 안정성을 세 단계로 구분한다.

- **안정**: 작은 교란 후 시스템이 평형점 근처에 머무른다 (공이 흔들리지만 바닥 근처에 있음)
- **점근적 안정(asymptotically stable)**: 시간이 지나면 정확히 평형점으로 수렴한다 (마찰로 공이 바닥 한가운데에 멈춤)
- **불안정**: 아무리 작은 교란에도 평형에서 멀어진다

엔지니어에게 가장 중요한 것은 점근적 안정이다. 로봇 팔이 목표 각도로 수렴하고, 드론이 지정 고도를 유지하려면, 시스템이 점근적으로 안정해야 한다.

## 리아푸노프의 통찰 -- 해를 구하지 않는 분석

1892년, 러시아 수학자 Aleksandr Lyapunov는 박사 논문 "운동의 안정성 일반 문제에 관하여"에서 혁명적 아이디어를 제시했다. 당시 안정성 분석은 미분방정식의 해를 직접 구한 뒤 시간에 따른 행동을 관찰하는 것이었다. 그러나 대부분의 비선형 시스템은 미분방정식의 해를 구할 수 없다.

리아푸노프의 통찰은 이것이다. **시스템의 "에너지"가 시간에 따라 줄어들면, 시스템은 안정적이다.** 물리 수업을 떠올려 보자. 물체를 높은 곳에서 놓으면 위치 에너지가 운동 에너지로 바뀌고, 마찰로 에너지가 소산되면서 결국 멈춘다. 에너지가 계속 줄어드는 시스템은 반드시 정지 상태에 도달한다. 리아푸노프는 이 물리적 직관을 순수 수학으로 일반화했다. 실제 물리적 에너지가 아니라, 에너지처럼 **행동하는** 수학적 함수를 찾으면 안정성을 증명할 수 있다. 이 함수가 리아푸노프 함수 V(x)다.

## 리아푸노프 직접 방법의 구조

V(x)가 리아푸노프 함수가 되려면 두 가지 조건을 만족해야 한다.

**조건 1: V(x) > 0 (평형점 이외에서 양수), V(0) = 0 (평형점에서 0)**

이것은 V(x)가 "높이" 또는 "에너지"처럼 동작한다는 뜻이다. 평형점이 골짜기의 가장 낮은 점이고, 다른 모든 곳은 그보다 높다. 산악 지형에서 가장 깊은 지점을 0으로 놓고, 주변의 모든 점이 양의 높이를 가지는 것과 같다.

**조건 2: 시간에 따른 변화**

- dV/dt ≤ 0 → 에너지가 증가하지 않으므로 시스템은 **안정**
- dV/dt < 0 (평형점 이외에서 엄격히 감소) → 에너지가 항상 줄어들므로 시스템은 **점근적 안정**

직관적으로 이렇게 상상하면 된다. 언덕 위의 공이 굴러내리는데, 에너지가 **항상** 줄어든다면 공은 결국 골짜기 바닥에 도달할 수밖에 없다. 핵심은 dV/dt를 시스템의 동역학 방정식과 V(x)의 기울기로부터 직접 계산할 수 있다는 것이다. 궤적을 일일이 추적하지 않고, 시스템의 구조만으로 에너지가 줄어드는지 판단할 수 있다. 이것이 "직접 방법(direct method)"이라 불리는 이유다.

이 방법의 위력은 비선형 시스템에서 드러난다. 선형 시스템은 고유값 분석으로 안정성을 판별할 수 있지만, 비선형 시스템에서는 미분방정식의 해를 구하는 것 자체가 불가능한 경우가 대부분이다. V(x)라는 "에너지 렌즈"를 통하면 해 없이도 시스템의 운명을 내다볼 수 있다. 그러나 **적절한 V(x)를 찾는 것 자체가 예술(art)에 가깝다.** 범용적 도출 방법이 없어, 후보 함수를 추측하고 조건을 검증하는 시행착오가 필요하다. 이 어려움이 AI가 개입하는 지점이 된다. 또한 리아푸노프 방법은 **충분 조건이지 필요 조건이 아니다** -- V(x)를 못 찾았다고 시스템이 불안정한 것은 아니다.

## AI로의 연결 -- 수학적 기반

리아푸노프 이론이 AI에 연결되는 경로는 네 갈래다. 모두 "에너지 감소 → 수렴 보장"이라는 핵심 구조를 공유하지만, 연결의 방향과 성격은 다르다.

**리아푸노프 → AI: 에너지 감소 구조의 차용**

**Hopfield 네트워크의 에너지 함수**: 가장 초기의 AI-리아푸노프 연결이다. Hopfield(1982)은 연상 기억 네트워크에 에너지 함수 E를 정의하고, 뉴런이 업데이트될 때마다 E가 단조 감소함을 증명했다. V(x) > 0이고 dV/dt ≤ 0인 리아푸노프 조건과 정확히 같은 구조이며, 네트워크가 반드시 저장된 기억 패턴에 수렴한다는 수학적 보장을 제공한다.

**SGD 수렴 분석**: 손실 함수 L(w)를 리아푸노프 함수처럼 다루어 SGD의 수렴을 증명하는 사후적 분석 도구로 활용된다. SGD가 리아푸노프에서 영감을 받은 것이 아니라, 이미 존재하는 알고리즘의 수렴성을 증명하는 데 틀이 차용된 사례다. 미니배치의 확률적 잡음 때문에 조건을 기댓값 형태로 완화하여 적용한다.

**안전한 강화학습(Safe RL)**: 로봇이 장애물을 피하면서 목표에 도달해야 할 때의 이중 보장 장치다. **CLF(제어 리아푸노프 함수)**는 목표 수렴을, **CBF(제어 장벽 함수)**는 안전 영역 이탈 방지를 보장한다. 내비게이션의 "목적지 안내"와 "진입 금지 구역" 전자 울타리를 결합한 것과 같다.

**AI → 리아푸노프: V(x) 자동 설계**

**신경 리아푸노프 함수(Neural Lyapunov Function)**: 인간이 설계하기 어려운 V(x)를 신경망으로 학습하는 역방향 접근이다. 복잡한 지형의 에너지 지도를 드론이 자동 스캔하는 것에 비유할 수 있다. Chang et al.(2019)은 학습기(learner)가 V(x)를 근사하면, 검증기(verifier)가 조건 위반 반례를 찾아 재훈련하는 반복 구조를 제안했다. 다만 유한한 점에서만 검증되므로, 수학적 완전성은 보장되지 않는다.

## 한계와 약점

- **V(x) 찾기의 어려움**: 고차원 시스템에서 적절한 V(x)를 찾는 것은 극도로 어렵다. 상태 변수가 수백 개인 시스템에서는 직관적 추측이 거의 불가능하다.
- **충분 조건의 한계**: V(x)를 못 찾았다고 시스템이 불안정한 것이 아니다. 더 나은 V(x)가 존재할 수 있으므로, 이 방법은 안정성을 증명할 수는 있어도 불안정성을 증명하기는 어렵다.
- **국소 분석의 제약**: 리아푸노프 함수가 유효한 영역이 평형점 근처에 국한될 수 있다. 전역적 안정성을 보장하려면 V(x)가 전체 상태 공간에서 조건을 만족해야 하며, 이는 훨씬 더 어렵다.
- **신경 리아푸노프의 검증 한계**: 신경망으로 학습한 V(x)는 유한한 점에서만 검증되므로, 수학적 완전성이 보장되지 않는다. 연속 공간 전체에서의 조건 만족을 입증하는 것은 여전히 열린 문제다.

## 용어 정리

리아푸노프 함수(Lyapunov function) - 에너지처럼 행동하는 수학적 함수. 평형점에서 0이고, 다른 곳에서 양수이며, 시간에 따라 감소하면 시스템의 안정성을 보장

점근적 안정성(asymptotic stability) - 교란 후 시스템이 시간이 지남에 따라 정확히 평형점으로 수렴하는 성질

평형점(equilibrium point) - 외부 입력 없이 시스템이 머무르는 상태. 공이 그릇 바닥에 정지해 있는 것에 해당

제어 리아푸노프 함수(control Lyapunov function, CLF) - 시스템을 목표 상태로 수렴시킬 수 있는 제어 입력이 항상 존재함을 보장하는 함수

제어 장벽 함수(control barrier function, CBF) - 시스템이 안전하지 않은 영역에 진입하지 않도록 보장하는 함수. CLF와 결합하여 "수렴 + 안전" 동시 보장

신경 리아푸노프 함수(neural Lyapunov function) - 리아푸노프 함수를 신경망으로 학습하는 방법. 학습기-검증기 반복 구조로 V(x)를 자동 발견. Chang et al.(2019)

양정치 함수(positive definite function) - V(x) > 0 (x ≠ 0)이고 V(0) = 0인 함수. 리아푸노프 함수의 첫 번째 조건이며, 에너지처럼 평형점에서 최솟값을 가지는 구조를 보장

에너지 함수(energy function) - 시스템의 상태를 하나의 스칼라 값으로 요약하는 함수. 리아푸노프 함수는 물리적 에너지가 아닌, 에너지와 유사한 수학적 구성물

---EN---
Lyapunov Stability Theory - A method for determining stability through the intuition that decreasing system energy implies stability, without solving differential equations

## What Is Stability

Imagine a ball inside a bowl. Push it sideways and it oscillates along the walls before returning to the bottom. This is a **stable** system. Now flip the bowl upside down and place the ball on top. The slightest breeze sends it rolling off, never to return. This is an **unstable** system.

Control theory distinguishes three levels of stability.

- **Stable**: after a small disturbance, the system stays near the equilibrium (the ball wobbles but remains near the bottom)
- **Asymptotically stable**: given enough time, the system converges exactly to the equilibrium (friction brings the ball to a dead stop at the center)
- **Unstable**: any disturbance, no matter how small, drives the system away from equilibrium

For engineers, asymptotic stability matters most. A robot arm converging to its target angle and a drone maintaining altitude both require asymptotic stability.

## Lyapunov's Insight -- Analysis Without Solving

In 1892, Russian mathematician Aleksandr Lyapunov presented a revolutionary idea in his doctoral thesis "On the General Problem of the Stability of Motion." At the time, stability analysis meant directly solving differential equations and observing behavior over time. But most nonlinear systems have no closed-form solution.

Lyapunov's insight: **if a system's "energy" decreases over time, the system is stable.** In physics, an object released from height converts potential energy to kinetic energy, and friction dissipates it until the object stops. A system whose energy keeps decreasing must eventually reach rest. Lyapunov generalized this intuition mathematically. Instead of actual physical energy, finding a mathematical function that **behaves like** energy suffices to prove stability. This function is the Lyapunov function V(x).

## The Structure of Lyapunov's Direct Method

For V(x) to qualify as a Lyapunov function, two conditions must hold.

**Condition 1: V(x) > 0 (positive away from equilibrium), V(0) = 0 (zero at equilibrium)**

This means V(x) acts like "height" or "energy." The equilibrium is the lowest point in a valley, and every other point is higher. Think of a mountain landscape where the deepest point is set to zero and all surrounding points have positive elevation.

**Condition 2: Change over time**

- dV/dt ≤ 0 → energy never increases, so the system is **stable**
- dV/dt < 0 (strictly decreasing away from equilibrium) → energy always decreases, so the system is **asymptotically stable**

Visualize it: a ball rolling downhill whose energy **always** decreases must eventually reach the valley floor. The key is that dV/dt can be computed directly from the system's dynamics and V(x)'s gradient. Without tracing actual trajectories, the structure of the system alone reveals whether energy decreases. This is why it is called the "direct method."

The method's power emerges with nonlinear systems. Linear systems can be analyzed via eigenvalues, but solving nonlinear differential equations is generally impossible. The "energy lens" of V(x) lets us foresee the system's fate without solving anything. Yet **finding a suitable V(x) is closer to art than algorithm.** No general-purpose derivation method exists, so trial and error with candidate functions is required. This difficulty is precisely where AI enters the picture. Also, Lyapunov's method provides a **sufficient but not necessary condition** -- failing to find V(x) does not prove instability.

## Connections to AI -- Mathematical Foundation

Lyapunov theory connects to AI through four paths, all sharing the core structure of "energy decrease → convergence guarantee," but differing in direction and character.

**Lyapunov → AI: Borrowing the Energy Decrease Structure**

**Hopfield network energy function**: The earliest AI-Lyapunov connection. Hopfield (1982) defined an energy function E over an associative memory network and proved E decreases monotonically with each neuron update. This mirrors Lyapunov conditions -- V(x) > 0 and dV/dt ≤ 0 -- providing a mathematical guarantee that the network converges to stored memory patterns.

**SGD convergence analysis**: The loss function L(w) is treated like a Lyapunov function to prove SGD convergence -- a post-hoc analytical tool, not an inspiration. SGD was not derived from Lyapunov theory; rather, the framework was borrowed to prove convergence of an existing algorithm. Stochastic noise prevents strict dV/dt < 0, so the condition is relaxed to hold in expectation.

**Safe reinforcement learning (Safe RL)**: A dual guarantee for robots that must reach goals while avoiding obstacles. **CLF (Control Lyapunov Function)** ensures convergence to the target, while **CBF (Control Barrier Function)** prevents leaving the safe region. Think of navigation's "route to destination" combined with a "no-entry zone" geofence.

**AI → Lyapunov: Automated V(x) Design**

**Neural Lyapunov Functions**: A reverse approach where neural networks learn V(x) that humans find difficult to design -- like a drone automatically scanning complex terrain to build an energy map. Chang et al. (2019) proposed an iterative structure: a learner approximates V(x), then a verifier searches for counterexamples violating the conditions. Counterexamples feed back into retraining. However, verification at finitely many points means mathematical completeness is not guaranteed.

## Limitations and Weaknesses

- **Difficulty of finding V(x)**: Finding a suitable V(x) for high-dimensional systems is extremely hard. When state variables number in the hundreds, intuitive guessing becomes virtually impossible.
- **Sufficient condition limitation**: Failure to find V(x) does not mean the system is unstable. A better V(x) may exist, so the method can prove stability but struggles to prove instability.
- **Local analysis constraint**: A Lyapunov function's valid region may be confined near the equilibrium. Global stability requires V(x) to satisfy conditions across the entire state space -- a much harder problem.
- **Verification limits of neural Lyapunov**: A neural-network-learned V(x) is verified only at finitely many points, so mathematical completeness is not guaranteed. Proving condition satisfaction over the entire continuous space remains an open problem.

## Glossary

Lyapunov function - a mathematical function that behaves like energy; zero at the equilibrium, positive elsewhere, and decreasing over time guarantees system stability

Asymptotic stability - the property that a system converges exactly to its equilibrium point over time following a disturbance

Equilibrium point - a state where a system remains without external input; analogous to a ball resting at the bottom of a bowl

Control Lyapunov function (CLF) - a function guaranteeing that a control input always exists to drive the system toward a target state

Control barrier function (CBF) - a function guaranteeing that a system never enters an unsafe region; combined with CLF for simultaneous convergence and safety guarantees

Neural Lyapunov function - a method for learning Lyapunov functions via neural networks; uses an iterative learner-verifier structure to automatically discover V(x). Chang et al. (2019)

Positive definite function - a function where V(x) > 0 for x ≠ 0 and V(0) = 0; the first condition for a Lyapunov function, ensuring it has a minimum at the equilibrium like energy

Energy function - a function summarizing a system's state as a single scalar value; a Lyapunov function is not physical energy but a mathematical construct that behaves similarly
