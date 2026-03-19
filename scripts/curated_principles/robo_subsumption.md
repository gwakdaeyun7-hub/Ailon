---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 포섭 아키텍처, 행동 기반 로보틱스, 체화된 인지, 반응형 에이전트, 창발적 행동, 브룩스
keywords_en: subsumption architecture, behavior-based robotics, embodied cognition, reactive agent, emergent behavior, Brooks
---
Subsumption Architecture (Brooks 1986) - 내부 세계 모델 없이 계층적 행동 레이어만으로 복잡한 행동을 창발시키는 로봇 제어 방식

## 전통 AI의 문제: 지도를 그리느라 한 걸음도 못 뗀 탐험가

1980년대까지 로봇 AI의 표준 접근법은 **SMPA**(Sense-Model-Plan-Act) 파이프라인이었다. 먼저 센서로 세상을 감지하고(Sense), 그 정보로 세상의 완전한 내부 모델을 구축한 뒤(Model), 그 모델 위에서 최적 행동을 계획하고(Plan), 비로소 행동한다(Act). 논리적으로는 완벽해 보이지만, 현실에서는 치명적 문제가 있었다.

현실 세계는 너무 복잡하고 변화가 빠르다. 로봇이 방 안의 모든 물체 위치를 정밀하게 모델링하는 동안, 고양이가 의자 위를 지나가고 사람이 문을 열어 바람이 불어온다. 모델이 완성될 즈음이면 이미 세상이 바뀌어 있다. 비유하자면, 정글을 탐험하면서 **완벽한 지도를 먼저 그린 후에야 첫 걸음을 떼려는 탐험가**와 같다. 지도를 그리는 동안 정글은 계속 변하고, 탐험가는 영원히 출발하지 못한다.

이 SMPA 접근법을 **GOFAI**(Good Old-Fashioned AI)라고 부른다. 세상을 기호(symbol)로 표상하고, 그 표상 위에서 논리적 추론과 탐색을 수행하는 방식이다. 체스처럼 규칙이 명확하고 상태가 완전히 관찰 가능한 환경에서는 강력하지만, 어지러운 거실에서 커피잔을 찾아 가져오는 것과 같은 현실 세계의 문제에는 무력했다.

## 브룩스의 급진적 대안

MIT의 Rodney Brooks는 1986년 논문 "A Robust Layered Control System for a Mobile Robot"에서 근본적으로 다른 접근을 제안했다. 그리고 1991년 "Intelligence Without Representation"에서 그 철학을 명확히 했다. 핵심 주장은 도발적이었다. **표상(representation) 없이도 지능이 가능하다**. 세상의 정밀한 내부 모델은 필요 없다. 왜냐하면 **"세상 자체가 최고의 모델"**이기 때문이다.

Brooks의 논리는 이러했다. 곤충을 보라. 바퀴벌레는 뇌가 불과 100만 개의 뉴런으로 구성되어 있지만, 장애물을 피하고, 먹이를 찾고, 포식자로부터 도망치는 놀라운 행동을 수행한다. 바퀴벌레가 방 안의 3D 모델을 머릿속에 구축해서 이런 행동을 할까? 아니다. 단순한 감각-행동 규칙들의 조합이 이 복잡한 행동을 만들어낸다. 수십억 년의 진화가 증명한 이 전략을 로봇에 적용하지 못할 이유가 있는가? Brooks는 이 통찰을 로봇 설계에 직접 적용했다.

## 포섭 아키텍처의 구조

Brooks가 제안한 포섭 아키텍처는 건물의 층처럼 쌓인 **행동 레이어**로 구성된다. 각 레이어는 독립적으로 작동하는 단순한 행동 모듈이다.

- **Level 0 (장애물 회피)**: 가장 아래층이자 가장 기본적인 행동. 센서가 장애물을 감지하면 방향을 바꾼다. 이 레이어만으로도 로봇은 충돌하지 않고 돌아다닐 수 있다.
- **Level 1 (배회)**: 특별한 목적 없이 주변을 돌아다니는 행동. 로봇에 탐색의 기본 동력을 제공한다.
- **Level 2 (탐색)**: 특정 방향이나 대상을 향해 이동하는 목표 지향적 행동.
- **Level 3 이상 (지도 작성, 계획 등)**: 더 복잡하고 추상적인 행동.

핵심 메커니즘은 **포섭(subsumption)**이다. 상위 레이어가 하위 레이어의 출력을 **억제**(inhibit)하거나 **대체**(suppress)할 수 있다. 예를 들어, Level 2가 "목표를 향해 직진"이라는 명령을 내리더라도, Level 0가 바로 앞에 장애물을 감지하면 Level 0의 "방향 전환"이 우선한다. 건물에 비유하면 이렇다. 1층(생존)은 항상 가동 중이다. 2층, 3층의 더 복잡한 기능은 필요할 때만 개입하지만, 1층이 위급 상황을 감지하면 모든 상위 층의 명령을 무시하고 즉각 대응한다.

## 창발적 행동: 단순함에서 복잡함으로

포섭 아키텍처의 가장 놀라운 특성은 **창발**(emergence)이다. 각 레이어는 극히 단순한 규칙만 수행한다. "장애물이 가까우면 돌아가라", "일정 시간 직진했으면 방향을 바꿔라" 같은 수준이다. 하지만 이 단순한 레이어들이 동시에 작동하며 서로 억제하고 대체하면, 전체 시스템은 예상보다 훨씬 복잡하고 적응적인 행동을 보인다. 마치 개미 한 마리는 단순한 규칙만 따르지만, 개미 군체 전체가 정교한 집을 짓고 효율적으로 먹이를 운반하는 것과 같다.

Brooks의 MIT 연구팀은 이를 실제 로봇으로 증명했다. **Allen**(1986)은 초음파 센서만으로 장애물을 피하며 돌아다니는 최초의 포섭 아키텍처 로봇이었다. **Herbert**(1988)는 사무실에서 빈 음료수 캔을 찾아 수거하는 행동을 보였는데, 이 행동은 설계자가 명시적으로 프로그래밍한 것이 아니라 여러 행동 레이어의 상호작용에서 자연스럽게 나타난 것이었다.

## AI와 로보틱스로의 영향

Brooks의 포섭 아키텍처는 AI와 로보틱스의 여러 흐름에 직접적 영향을 미쳤다.

**체화된 인지(Embodied AI)**: 지능은 추상적인 기호 처리가 아니라, **신체와 환경의 상호작용**에서 나온다는 철학이다. Brooks의 작업은 이 관점의 핵심 사례가 되었다. 현대 로봇 학습에서 가상 환경에서 훈련한 정책을 실제 로봇에 이식하는 sim-to-real transfer가 중시되는 것도, 물리적 경험이 지능에 본질적이라는 인식의 연장선이다.

**반응형 에이전트(Reactive Agent)**: 복잡한 내부 계획 없이, 환경의 자극에 즉각 반응하여 행동을 결정하는 에이전트 아키텍처다. 게임 AI에서 널리 쓰이는 behavior tree(행동 트리)도 조건에 따라 우선순위가 다른 행동을 계층적으로 구성한다는 점에서, 포섭 아키텍처의 구조적 후손이다.

**종단간 학습(End-to-end Learning)**: 센서 입력에서 행동 출력으로 직접 매핑한다는 철학적 연결이 있다. 내부에 명시적 세계 모델을 구축하지 않고, 입력과 출력의 관계를 데이터에서 직접 학습하는 접근은 Brooks의 "표상 없는 지능"과 정신적 뿌리를 공유한다.

**다중 에이전트 시스템(Multi-agent Systems)**: 단순한 개별 에이전트들의 상호작용에서 복잡한 전체 행동이 창발한다는 아이디어는 포섭 아키텍처의 창발 개념과 구조적으로 유사하다. 드론 군집이 개별 회피 규칙만으로 충돌 없이 편대 비행을 하는 것이 대표적 사례다.

## 한계와 비판

포섭 아키텍처에는 분명한 한계도 있다.

**확장성 문제**: 레이어 수가 적을 때는 상호작용이 예측 가능하지만, 레이어가 10개, 20개로 늘어나면 어느 레이어가 어느 레이어를 억제하는지의 조합이 폭발적으로 증가한다. 복잡한 행동을 추가할수록 시스템 전체의 동작을 예측하기 어려워진다.

**추상적 추론 불가**: 체스를 두거나, 수학 증명을 하거나, 내일의 일정을 계획하는 것은 포섭 아키텍처로 불가능하다. 이런 작업에는 세상의 추상적 표상과 그 위에서의 추론이 필수적이다. 바퀴벌레가 장애물을 피할 수는 있지만, 미로의 최단 경로를 계산할 수는 없는 것과 같다.

**현대적 해법 -- 하이브리드**: 현대 로보틱스는 반응형 제어와 계획 기반 제어를 결합한 하이브리드 접근을 채택한다. 저수준에서는 포섭 아키텍처처럼 즉각적 반응을 처리하고, 고수준에서는 내부 모델을 사용한 계획을 수행한다. 흥미롭게도 Brooks 자신이 1990년에 공동 창업한 iRobot의 Roomba 로봇 청소기도, 순수한 포섭 아키텍처가 아닌 실용적 하이브리드 설계를 채택했다.

## 용어 정리

포섭(subsumption) - 상위 행동 레이어가 하위 레이어의 출력을 억제하거나 대체하여 제어권을 넘겨받는 메커니즘

GOFAI(Good Old-Fashioned AI) - 기호 표상과 논리적 추론에 기반한 전통적 AI 접근법

표상(representation) - 외부 세계의 사물이나 상태를 시스템 내부에 기호나 데이터 구조로 표현한 것

창발적 행동(emergent behavior) - 단순한 구성 요소들의 상호작용에서 설계자가 명시적으로 프로그래밍하지 않은 복잡한 행동이 자연스럽게 나타나는 현상

체화된 인지(embodied cognition) - 지능이 추상적 기호 처리가 아니라 신체와 환경의 물리적 상호작용에서 발생한다는 관점

행동 레이어(behavior layer) - 포섭 아키텍처에서 독립적으로 작동하는 하나의 감각-행동 규칙 모듈

반응형 에이전트(reactive agent) - 내부 세계 모델이나 복잡한 계획 없이 환경 자극에 즉각 반응하여 행동을 결정하는 에이전트
---EN---
Subsumption Architecture (Brooks 1986) - A robot control method that produces complex behavior through hierarchical behavior layers without an internal world model

## The Problem with Traditional AI: An Explorer Who Maps Before Walking

Until the 1980s, the standard approach to robot AI was the **SMPA** (Sense-Model-Plan-Act) pipeline. First sense the world through sensors (Sense), build a complete internal model of the world from that data (Model), plan the optimal action on that model (Plan), and only then act (Act). It looked logically perfect, but in practice had fatal problems.

The real world is too complex and changes too quickly. While a robot meticulously models every object's position in a room, a cat crosses the chair and someone opens a door letting in a draft. By the time the model is complete, the world has already changed. It is like an **explorer in a jungle who insists on drawing a perfect map before taking the first step**. The jungle keeps changing while the map is being drawn, and the explorer never departs.

This SMPA approach is called **GOFAI** (Good Old-Fashioned AI). It represents the world through symbols and performs logical reasoning and search on that representation. It was powerful in environments with clear rules and fully observable states, like chess, but helpless at real-world tasks like finding and fetching a coffee mug from a messy living room.

## Brooks's Radical Alternative

MIT's Rodney Brooks proposed a fundamentally different approach in his 1986 paper "A Robust Layered Control System for a Mobile Robot," and clarified the philosophy in "Intelligence Without Representation" (1991). His core claim was provocative: **intelligence is possible without representation**. A precise internal model of the world is unnecessary because **"the world is its own best model."**

Brooks's logic was this: look at insects. A cockroach has only about one million neurons, yet it performs remarkable feats -- avoiding obstacles, finding food, escaping predators. Does a cockroach build a 3D model of the room in its head? No. Simple combinations of sensory-action rules produce this complex behavior. Brooks applied this insight directly to robot design.

## The Structure of Subsumption Architecture

Brooks's subsumption architecture consists of **behavior layers** stacked like floors of a building. Each layer is a simple behavior module that operates independently.

- **Level 0 (Obstacle avoidance)**: The ground floor and most basic behavior. When sensors detect an obstacle, change direction. This layer alone allows the robot to move around without crashing.
- **Level 1 (Wandering)**: Moving around without specific purpose. Provides the robot with a basic drive to explore.
- **Level 2 (Exploration)**: Goal-directed movement toward a specific direction or target.
- **Level 3 and above (Mapping, planning, etc.)**: More complex and abstract behaviors.

The key mechanism is **subsumption**. Higher layers can **inhibit** or **suppress** the outputs of lower layers. For example, even if Level 2 issues a "go straight toward the target" command, if Level 0 detects an obstacle directly ahead, Level 0's "change direction" takes priority. Using the building analogy: the ground floor (survival) is always running. Upper floors with more complex functions intervene only when needed, but when the ground floor detects an emergency, it overrides all commands from above and responds immediately.

## Emergent Behavior: Complexity from Simplicity

The most striking property of subsumption architecture is **emergence**. Each layer follows only extremely simple rules -- things like "if an obstacle is close, turn away" or "if you've gone straight long enough, change direction." But when these simple layers operate simultaneously, inhibiting and overriding one another, the total system exhibits behavior far more complex and adaptive than expected. It is like how an individual ant follows only simple rules, yet an entire ant colony builds elaborate nests and transports food with remarkable efficiency.

Brooks's MIT team demonstrated this with real robots. **Allen** (1986) was the first subsumption architecture robot, navigating and avoiding obstacles using only sonar sensors. **Herbert** (1988) exhibited the behavior of finding and collecting empty soda cans in an office -- behavior that was not explicitly programmed by the designer but emerged naturally from the interaction of multiple behavior layers.

## Impact on AI and Robotics

Brooks's subsumption architecture directly influenced several currents in AI and robotics.

**Embodied AI**: The philosophy that intelligence arises not from abstract symbol manipulation but from **interaction between body and environment**. Brooks's work became a cornerstone example. That modern robot learning emphasizes sim-to-real transfer -- transplanting policies trained in virtual environments to physical robots -- extends the recognition that physical experience is essential to intelligence.

**Reactive Agent**: An agent architecture that determines actions through immediate response to environmental stimuli, without complex internal planning. The behavior tree widely used in game AI is a structural descendant of subsumption architecture, organizing behaviors hierarchically with different priorities based on conditions.

**End-to-end Learning**: There is a philosophical connection in directly mapping sensor inputs to action outputs. Approaches that learn the input-output relationship directly from data without building an explicit internal world model share intellectual roots with Brooks's "intelligence without representation."

**Multi-agent Systems**: The idea that complex collective behavior emerges from interactions among simple individual agents is structurally similar to the emergence concept in subsumption architecture.

## Limitations and Criticisms

Subsumption architecture has clear limitations as well.

**Scalability problem**: With few layers, interactions are predictable, but as layers grow to 10 or 20, the possible combinations of which layer inhibits which explode. The more complex behaviors are added, the harder it becomes to predict the system's overall operation.

**No abstract reasoning**: Playing chess, proving mathematical theorems, or planning tomorrow's schedule is impossible with subsumption architecture. Such tasks require abstract representation of the world and reasoning over it. A cockroach can avoid obstacles but cannot compute the shortest path through a maze.

**Modern solution -- hybrid**: Modern robotics adopts a hybrid approach combining reactive and plan-based control. Low-level processing handles immediate reactions like subsumption architecture, while high-level processing performs planning using internal models. Interestingly, even iRobot's Roomba vacuum robot -- co-founded by Brooks himself in 1990 -- adopted a pragmatic hybrid design rather than pure subsumption architecture.

## Glossary

Subsumption - the mechanism by which a higher behavior layer inhibits or replaces the output of a lower layer to take control

GOFAI (Good Old-Fashioned AI) - the traditional AI approach based on symbolic representation and logical reasoning

Representation - expressing external world objects or states as symbols or data structures within a system

Emergent behavior - a phenomenon where complex behaviors that were not explicitly programmed by the designer arise naturally from interactions among simple components

Embodied cognition - the view that intelligence arises from physical interaction between body and environment, not from abstract symbol processing

Behavior layer - a single sensory-action rule module that operates independently within subsumption architecture

Reactive agent - an agent that determines actions through immediate response to environmental stimuli without an internal world model or complex planning
