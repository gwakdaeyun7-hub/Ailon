---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 경사하강법, 확률적 경사하강법, 학습률, 미니배치, 모멘텀, 적응적 학습률, 손실 곡면
keywords_en: gradient descent, stochastic gradient descent, learning rate, mini-batch, momentum, adaptive learning rate, loss landscape
---
Gradient Descent - 함수의 기울기를 따라 반복적으로 내려가며 최솟값을 찾는 최적화의 근본 알고리즘

## 최급강하법의 수학적 원리

경사하강법의 수학적 뿌리는 Cauchy(1847)의 최급강하법(method of steepest descent)이다. Cauchy는 천문학 궤도 계산에서 연립방정식의 해를 반복 근사하는 방법을 연구하면서, 한 가지 사실을 이용했다. 다변수 함수에서 그래디언트(gradient)는 함수 값이 가장 가파르게 증가하는 방향을 가리킨다. 따라서 **그래디언트의 반대 방향**으로 이동하면 함수 값이 가장 빠르게 감소한다.

공간적으로 상상하면 이렇다. 안개 낀 산에서 가장 낮은 골짜기를 찾아야 하는데, 지도는 없고 발밑의 경사만 느낄 수 있다. 가장 합리적인 전략은 발밑이 가장 가파르게 내려가는 방향으로 한 걸음 내딛고, 다시 경사를 느끼고, 또 내딛는 것이다.

갱신 규칙은 하나다.

theta(t+1) = theta(t) - eta * grad(L(theta(t)))

theta는 최적화할 파라미터, eta는 학습률(learning rate), grad(L)은 손실 함수 L의 그래디언트다. 이 한 줄의 수식이 현대 딥러닝 모든 학습 과정의 뼈대를 이룬다.

## 수학에서 AI로: 세 번의 도약

**첫 번째 도약 -- 확률적 근사.** Cauchy의 원래 방법은 전체 데이터에 대한 정확한 그래디언트를 계산한다. 하지만 데이터가 수백만 건이면 매 스텝마다 전체를 훑는 것은 비현실적이다. Robbins & Monro(1951)의 확률적 근사 이론은, 무작위로 뽑은 소수 샘플의 노이즈 섞인 추정치로도 수렴할 수 있음을 증명했다. 이것이 확률적 경사하강법(SGD)이다.

**두 번째 도약 -- 역전파.** 다층 신경망에서 수만 개의 가중치 각각에 대한 그래디언트를 효율적으로 계산하는 방법이 필요했다. Rumelhart, Hinton & Williams(1986)가 연쇄 법칙(chain rule)을 이용해 출력층의 오차를 역방향으로 전파하며 모든 가중치의 그래디언트를 한 번에 계산할 수 있음을 시연했다.

**세 번째 도약 -- 규모 확장.** 미니배치 SGD + GPU 병렬 연산의 결합(2010년대)이 수십억 파라미터 학습을 가능하게 만들었다.

핵심 대응 관계는 다음과 같다.

- 수학의 함수 최솟값 --> **신경망의 손실 최소화**
- 그래디언트(기울기 벡터) --> **각 가중치의 갱신 방향** (역전파로 계산)
- 스텝 크기 --> **학습률 eta**
- Robbins-Monro의 확률적 추정 --> **미니배치 그래디언트** (32~512개 샘플로 추정)

## 한 스텝의 해부: SGD의 작동 방식

1. 전체 학습 데이터에서 미니배치(보통 32~512개 샘플)를 무작위로 추출한다
2. 미니배치에 대해 모델의 예측을 계산한다 (순전파)
3. 예측과 정답의 차이를 손실 함수 L로 측정한다
4. 역전파로 모든 파라미터에 대한 grad(L)을 계산한다
5. 갱신 규칙을 적용한다: theta(t+1) = theta(t) - eta * grad_batch(L)
6. 1~5를 모든 미니배치에 대해 반복한다 (1에포크 = 전체 데이터 1회 순회)

핵심 성질은 E[grad_batch] = grad(L), 즉 미니배치 추정치의 기댓값이 참 그래디언트와 같다는 비편향성이다. 배치 크기가 커지면 추정 분산이 줄어 안정적이지만 계산 비용이 커지고, 작으면 노이즈가 크지만 한 스텝이 빠르고 지역 최솟값 탈출에 유리하다.

## 학습률: 가장 중요한 하이퍼파라미터

학습률 eta는 경사하강법의 행동을 지배하는 단일 스칼라 값이다.

- **eta가 너무 크면**: 최솟값을 지나쳐 발산한다
- **eta가 너무 작으면**: 수렴이 극도로 느려진다
- **적절한 eta**: 처음에는 크게 잡아 빠르게 좋은 영역으로 이동하고, 점차 줄여서 정밀하게 수렴시키는 것이 표준 전략이다

Robbins & Monro(1951)가 증명한 수렴 조건은 두 가지다. sum(eta_t) = 무한대 (충분히 멀리 이동 가능), sum(eta_t^2) < 무한대 (노이즈가 점차 소멸). 실무에서는 cosine annealing, warmup-decay 같은 경험적 스케줄이 쓰이지만, 핵심 직관 -- 초반에 넓게, 후반에 좁게 -- 은 동일하다.

## 모멘텀과 적응적 방법: 순수 SGD의 약점 극복

순수 SGD의 두 가지 구조적 약점 -- 좁고 긴 골짜기에서의 진동과 미니배치 노이즈 -- 을 수십 년의 연구가 개선했다.

Polyak(1964)의 **모멘텀**은 물리학의 관성에서 영감을 받았다. 이전 갱신 방향의 기억을 유지하여 일관된 방향으로 가속하고 진동을 감쇠한다. v(t) = beta * v(t-1) + grad(L)에서 beta(보통 0.9)가 관성 계수다. Nesterov(1983)는 모멘텀이 데려갈 예상 위치에서 그래디언트를 계산해 방향을 보정하는 "미리 보기"를 추가했다.

**적응적 학습률** 계열은 각 파라미터마다 다른 학습률을 자동 조절한다. AdaGrad(Duchi et al., 2011)는 과거 그래디언트 제곱의 누적합으로 나누어 파라미터별 학습률을 조정하지만, 누적합이 단조 증가하여 학습률이 너무 빨리 감소하는 문제가 있다. RMSprop(Hinton, 2012)이 지수 이동 평균으로 이를 해결했고, Adam(Kingma & Ba, 2015)은 모멘텀과 RMSprop을 결합하여 현재 딥러닝에서 가장 널리 쓰이는 옵티마이저가 되었다.

## SGD 노이즈의 역설: 결점이 장점으로

SGD의 그래디언트 노이즈는 원래 단점으로 여겨졌지만, 과파라미터화 시대에 재평가되었다. 신경망 손실 곡면의 날카로운 최솟값(sharp minimum)은 새 데이터에 취약하고, 편평한 최솟값(flat minimum)은 일반화 성능이 좋다.

Smith & Le(2018)는 SGD 노이즈가 학습률/배치크기 비율에 의한 "유효 온도"로 작용하여, 높은 온도가 날카로운 최솟값에서 탈출시키고 편평한 최솟값으로 수렴하게 만든다고 보였다. SGD의 "결점"이 사실상 암묵적 정규화(implicit regularization)로 기능하는 역설이다.

이 "유효 온도" 개념은 통계역학의 온도와 구조적으로 유사하지만, 확률적 미분 방정식 분석에서 자연스럽게 등장한 양이며, 물리학적 비유는 사후적으로 부여된 측면이 강하다.

## 현대 AI 기법과의 연결

**수학적 원리의 직접 적용:**

- **역전파 + SGD**: Cauchy의 최급강하법 -> Robbins-Monro의 확률적 확장 -> 역전파라는 직접적 계보. 현대 트랜스포머의 수십억 파라미터 학습도 이 원리의 규모 확장이다
- **Adam 옵티마이저**: 모멘텀과 적응적 학습률을 결합한 경사하강법의 직접적 변형. 대규모 언어 모델 학습의 사실상 표준이다
- **미세 조정(fine-tuning)**: 사전 학습된 모델의 파라미터를 작은 학습률의 SGD/Adam으로 재조정하는 기법으로, 학습률 조절이라는 핵심 원리를 직접 활용한다

**구조적 유사성:**

- **정책 경사법(Policy Gradient)**: REINFORCE(Williams, 1992)는 보상의 기댓값에 대한 그래디언트를 추정하여 정책을 갱신한다. 같은 수학적 틀의 다른 맥락 적용이다
- **진화 전략**: Salimans et al.(2017)은 파라미터에 노이즈를 주입하고 보상 차이로 그래디언트를 추정하여, 역전파 없이도 경사하강법과 유사한 갱신이 가능함을 보였다

## 한계와 약점

- **비볼록 손실 곡면**: 딥러닝의 손실 함수는 극도로 비볼록이다. 전역 최솟값 도달을 보장하는 이론은 없다. 고차원에서는 지역 최솟값보다 안장점(saddle point)이 더 큰 문제로, 그래디언트가 0에 가까워져 학습이 정체된다
- **학습률 민감성**: 학습률이 너무 크면 발산, 너무 작으면 정체. warmup, cosine decay 등 학습률 스케줄링이 별도 연구 분야를 형성했다
- **곡률 무시**: 순수 경사하강법은 1차 정보(기울기)만 사용하고 2차 정보(곡률)를 무시한다. 뉴턴법은 곡률로 수렴이 빠르지만, 헤시안 행렬 계산이 O(n^2) 메모리, O(n^3) 연산을 요구하여 대규모 모델에 비실용적이다
- **그래디언트 소실/폭발**: 깊은 네트워크에서 역전파 시 그래디언트가 기하급수적으로 작아지거나 커진다. ResNet의 잔차 연결과 그래디언트 클리핑이 완화하지만 근본 해결은 아니다

## 용어 정리

그래디언트(gradient) - 다변수 함수의 각 변수에 대한 편미분을 모은 벡터. 함수가 가장 가파르게 증가하는 방향과 크기를 나타냄

학습률(learning rate) - 각 갱신 스텝에서 그래디언트 방향으로 얼마나 이동할지 결정하는 양의 스칼라 값

미니배치(mini-batch) - 전체 데이터의 부분집합으로, SGD에서 그래디언트 추정에 사용하는 샘플 묶음. 보통 32~512개

모멘텀(momentum) - 이전 갱신 방향의 가중 평균을 유지하여 일관된 방향으로 가속하고 진동을 감쇠하는 기법

안장점(saddle point) - 한 방향으로는 극소이고 다른 방향으로는 극대인 점. 고차원 비볼록 함수에서 빈번히 발생

암묵적 정규화(implicit regularization) - SGD의 노이즈가 편평한 최솟값을 선호하게 만들어 일반화 성능을 높이는 효과

역전파(backpropagation) - 연쇄 법칙으로 다층 신경망의 모든 가중치에 대한 손실의 그래디언트를 역방향 전파하며 계산하는 알고리즘

비볼록 함수(non-convex function) - 지역 최솟값이 여러 개 존재할 수 있는 함수. 전역 최솟값 도달이 보장되지 않음

---EN---
Gradient Descent - The fundamental optimization algorithm that iteratively follows the slope of a function to find its minimum

## The Mathematical Principle of Steepest Descent

The mathematical root of gradient descent is Cauchy's (1847) method of steepest descent. While studying iterative approximation of solutions in astronomical orbit calculations, Cauchy exploited one fact: in a multivariable function, the gradient points in the direction of steepest increase. Moving in the **opposite direction** decreases the function value most rapidly.

Spatially: imagine finding the lowest valley on a foggy mountain with no map -- only the ability to feel the slope beneath your feet. The most rational strategy is to step in the steepest downhill direction, feel the slope again, and step again.

One update rule:

theta(t+1) = theta(t) - eta * grad(L(theta(t)))

Here theta is the parameter, eta is the learning rate, and grad(L) is the gradient. This single formula forms the backbone of all modern deep learning training.

## From Mathematics to AI: Three Leaps

**First leap -- stochastic approximation.** Cauchy's method computes the exact gradient over all data. With millions of data points, this is impractical. Robbins & Monro (1951) proved convergence is achievable using noisy estimates from randomly selected small subsets. This is stochastic gradient descent (SGD).

**Second leap -- backpropagation.** Computing gradients for tens of thousands of weights in multi-layer networks was needed. Rumelhart, Hinton & Williams (1986) demonstrated using the chain rule to propagate errors backward, efficiently computing all weight gradients in one pass.

**Third leap -- scaling up.** Mini-batch SGD + GPU parallelism (2010s) enabled training models with billions of parameters.

Key correspondences:

- Mathematical function minimization --> **neural network loss minimization**
- Gradient --> **weight update direction** (via backpropagation)
- Step size --> **learning rate eta**
- Robbins-Monro stochastic estimation --> **mini-batch gradient** (32-512 samples)

## Anatomy of One Step: How SGD Works

1. Randomly sample a mini-batch (32-512 samples) from training data
2. Compute model predictions (forward pass)
3. Measure prediction-target difference via loss function L
4. Compute grad(L) for all parameters via backpropagation
5. Apply update: theta(t+1) = theta(t) - eta * grad_batch(L)
6. Repeat for all mini-batches (one epoch = one full pass)

The crucial property: E[grad_batch] = grad(L) -- the mini-batch estimate is unbiased. Larger batches reduce variance but increase cost; smaller batches add noise but speed up steps and help escape local minima.

## Learning Rate: The Most Important Hyperparameter

The learning rate eta governs gradient descent's behavior.

- **eta too large**: Overshoots the minimum, diverges
- **eta too small**: Convergence becomes extremely slow
- **Appropriate eta**: Start large for rapid movement to good regions, gradually reduce for precise convergence

Robbins & Monro's convergence conditions: sum(eta_t) = infinity (can travel far enough) and sum(eta_t^2) < infinity (noise eventually vanishes). In practice, cosine annealing and warmup-decay schedules are used, but the core intuition -- broad early, narrow late -- remains.

## Momentum and Adaptive Methods: Overcoming Pure SGD's Weaknesses

Decades of research addressed pure SGD's two weaknesses: oscillation in narrow valleys and mini-batch noise.

Polyak's (1964) **momentum**, inspired by physical inertia, maintains memory of previous directions to accelerate consistently and dampen oscillation. In v(t) = beta * v(t-1) + grad(L), beta (typically 0.9) is the inertia coefficient. Nesterov (1983) added "look-ahead" -- computing gradients at the anticipated position.

**Adaptive learning rate** methods automatically adjust per-parameter rates. AdaGrad (Duchi et al., 2011) divides by accumulated squared gradients but suffers from rates approaching zero too quickly. RMSprop (Hinton, 2012) solved this with exponential moving averages. Adam (Kingma & Ba, 2015) combined momentum and RMSprop, becoming deep learning's most widely used optimizer.

## The SGD Noise Paradox: Defect Becomes Advantage

SGD noise was originally considered a drawback, but was reevaluated in the overparameterized era. Sharp minima are vulnerable to new data; flat minima generalize better.

Smith & Le (2018) showed SGD noise acts as an "effective temperature" (learning rate/batch size ratio), causing escape from sharp minima toward flat ones. SGD's "defect" functions as implicit regularization.

This "effective temperature" is structurally analogous to statistical mechanics temperature but emerged from stochastic differential equation analysis -- the physical analogy was largely assigned after the fact.

## Connections to Modern AI

**Direct application of the mathematical principle:**

- **Backpropagation + SGD**: Direct lineage from Cauchy -> Robbins-Monro -> backpropagation. Modern transformer training with billions of parameters is a scaling of this principle
- **Adam optimizer**: Combining momentum and adaptive rates, a direct variant of gradient descent and the de facto standard for large language model training
- **Fine-tuning**: Adjusting pretrained parameters with small-learning-rate SGD/Adam directly leverages the learning rate control principle

**Structural similarities:**

- **Policy Gradient**: REINFORCE (Williams, 1992) estimates the gradient of expected reward to update policy -- the same framework in a different context
- **Evolution Strategies**: Salimans et al. (2017) showed gradient-descent-like updates are possible without backpropagation by injecting parameter noise

## Limitations and Weaknesses

- **Non-convex loss surfaces**: Deep learning losses are extremely non-convex with no guarantee of reaching the global minimum. In high dimensions, saddle points -- where gradients approach zero -- are a bigger problem than local minima
- **Learning rate sensitivity**: Too large causes divergence, too small causes stagnation. Learning rate scheduling has become a separate research area
- **Ignoring curvature**: Pure gradient descent uses only first-order (slope) information, ignoring second-order (curvature). Newton's method uses curvature but requires O(n^2) memory and O(n^3) operations, impractical for large models
- **Vanishing/exploding gradients**: Gradients shrink or grow exponentially through deep network layers. Skip connections and gradient clipping mitigate but do not fundamentally solve this

## Glossary

Gradient - a vector of partial derivatives indicating the direction and magnitude of steepest increase

Learning rate - a positive scalar determining how far to move per update step in the gradient direction

Mini-batch - a subset of training data used for gradient estimation in SGD, typically 32-512 samples

Momentum - maintaining a weighted average of previous update directions to accelerate consistently and dampen oscillations

Saddle point - a point that is a minimum in one direction and maximum in another; frequent in high-dimensional non-convex functions

Implicit regularization - the effect by which SGD noise causes preference for flat minima, improving generalization

Backpropagation - computing loss gradients for all weights by propagating errors backward through layers via the chain rule

Non-convex function - a function with potentially multiple local minima; the global minimum is not guaranteed to be reached