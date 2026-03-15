---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 경사하강법, 확률적 경사하강법, 학습률, 미니배치, 모멘텀, 적응적 학습률, 손실 곡면
keywords_en: gradient descent, stochastic gradient descent, learning rate, mini-batch, momentum, adaptive learning rate, loss landscape
---
Gradient Descent and Stochastic Gradient Descent - 함수의 기울기를 따라 반복적으로 내려가며 최솟값을 찾는 최적화의 근본 알고리즘

## 최급강하법의 수학적 원리

경사하강법의 수학적 뿌리는 Cauchy(1847)의 최급강하법(method of steepest descent)이다. Cauchy는 천문학 궤도 계산에서 연립방정식의 해를 반복 근사하는 방법을 연구하면서, 한 가지 사실을 이용했다. 다변수 함수에서 그래디언트(gradient)는 함수 값이 가장 가파르게 증가하는 방향을 가리킨다. 따라서 **그래디언트의 반대 방향**으로 이동하면 함수 값이 가장 빠르게 감소한다.

공간적으로 상상하면 이렇다. 안개 낀 산에서 가장 낮은 골짜기를 찾아야 하는데, 지도는 없고 발밑의 경사만 느낄 수 있다. 가장 합리적인 전략은 발밑이 가장 가파르게 내려가는 방향으로 한 걸음 내딛고, 다시 경사를 느끼고, 또 내딛는 것이다. 이 직관을 수학적으로 정식화한 것이 경사하강법이다.

갱신 규칙은 하나다.

theta(t+1) = theta(t) - eta * grad(L(theta(t)))

theta는 최적화할 파라미터, eta는 학습률(learning rate), grad(L)은 손실 함수 L의 그래디언트(각 파라미터에 대한 편미분을 모은 벡터)다. eta가 0.01이고 기울기가 +2라면, 파라미터는 -2 방향으로 0.02만큼 이동한다. 이 한 줄의 수식이 현대 딥러닝 모든 학습 과정의 뼈대를 이룬다.

## 수학에서 AI로: 세 번의 도약

순수 수학에서 태어난 이 원리가 AI의 핵심 엔진이 되기까지 세 번의 결정적 전환이 있었다.

**첫 번째 도약 -- 확률적 근사.** Cauchy의 원래 방법은 전체 데이터에 대한 정확한 그래디언트를 계산한다(배치 경사하강법). 하지만 데이터가 수백만 건이면 매 스텝마다 전체를 훑는 것은 비현실적이다. Robbins & Monro(1951)가 돌파구를 열었다. 이들의 확률적 근사(stochastic approximation) 이론은, 전체 그래디언트 대신 무작위로 뽑은 소수의 샘플에서 계산한 노이즈 섞인 추정치로도 수렴할 수 있음을 증명했다. 이것이 확률적 경사하강법(SGD)이다.

**두 번째 도약 -- 역전파.** 경사하강법이 있어도, 다층 신경망에서 수만 개의 가중치 각각에 대한 그래디언트를 계산하는 방법이 없으면 쓸모가 없다. Rumelhart, Hinton & Williams(1986)가 연쇄 법칙(chain rule)을 이용해 출력층의 오차를 입력층까지 역방향으로 전파하며 모든 가중치의 그래디언트를 한 번에 효율적으로 계산할 수 있음을 시연했다. 수학적 아이디어 자체는 Linnainmaa(1970)의 자동 미분과 Werbos(1974)의 신경망 적용이 선행했지만, 1986년 논문이 실제 학습 가능성을 설득력 있게 보여주며 분야의 전환점을 만들었다.

**세 번째 도약 -- 규모 확장.** 미니배치 SGD + GPU 병렬 연산의 결합(2010년대)이 수십억 파라미터 학습을 가능하게 만들었다.

핵심 대응 관계는 다음과 같다.

- 수학의 함수 최솟값 --> **신경망의 손실 최소화** (학습 목표)
- 그래디언트(기울기 벡터) --> **각 가중치의 갱신 방향** (역전파로 계산)
- 스텝 크기 --> **학습률 eta** (한 번에 얼마나 이동할지)
- 반복 수렴 과정 --> **에포크(epoch) 단위 학습 루프** (전체 데이터를 여러 번 순회)
- Robbins-Monro의 확률적 추정 --> **미니배치 그래디언트** (32~512개 샘플로 추정)

## 한 스텝의 해부: SGD의 작동 방식

SGD의 각 반복을 단계별로 분해하면 다음과 같다.

1. 전체 학습 데이터에서 미니배치(보통 32~512개 샘플)를 무작위로 추출한다
2. 미니배치에 대해 모델의 예측을 계산한다 (순전파, forward pass)
3. 예측과 정답의 차이를 손실 함수 L로 측정한다
4. 역전파로 모든 파라미터에 대한 grad(L)을 계산한다
5. 갱신 규칙을 적용한다: theta(t+1) = theta(t) - eta * grad_batch(L)
6. 1~5를 모든 미니배치에 대해 반복한다 (1에포크 = 전체 데이터 1회 순회)

3단계에서 구한 grad_batch는 전체 그래디언트의 추정치다. 핵심 성질은 E[grad_batch] = grad(L), 즉 미니배치 추정치의 기댓값이 참 그래디언트와 같다는 비편향성(unbiasedness)이다. 배치 크기가 커지면 추정 분산이 줄어 안정적이지만, 계산 비용이 커진다. 배치 크기가 작으면 노이즈가 크지만, 한 스텝이 빠르고 지역 최솟값 탈출에 유리하다. 이 트레이드오프가 미니배치 크기를 결정한다.

## 학습률: 가장 중요한 하이퍼파라미터

학습률 eta는 경사하강법의 행동을 지배하는 단일 스칼라 값이다. 그 영향은 극단적이다.

- **eta가 너무 크면**: 최솟값을 지나쳐서 반대편으로 날아간다. 더 심하면 스텝마다 손실이 커지는 발산이 일어난다. eta = 1.0으로 2차 함수를 최적화하면 최솟값 양쪽을 진동하며 점점 멀어지는 모습을 볼 수 있다.
- **eta가 너무 작으면**: 수렴이 극도로 느려진다. eta = 0.0001이면 올바른 방향으로 가지만, 실용적 시간 안에 도달하지 못한다.
- **적절한 eta**: 처음에는 크게 잡아 빠르게 좋은 영역으로 이동하고, 점차 줄여서 정밀하게 수렴시키는 것이 표준 전략이다.

Robbins & Monro(1951)가 증명한 수렴 조건은 두 가지다. sum(eta_t) = 무한대 (충분히 멀리 이동 가능), sum(eta_t^2) < 무한대 (노이즈가 점차 소멸). 실무에서는 이 이론적 조건 대신 cosine annealing, warmup-decay 같은 경험적 스케줄이 쓰이지만, 핵심 직관 -- 초반에 넓게, 후반에 좁게 -- 은 동일하다.

## 모멘텀과 적응적 방법: 순수 SGD의 약점 극복

순수 SGD는 두 가지 구조적 약점이 있다. 좁고 긴 골짜기 지형에서 벽면을 번갈아 치며 느리게 전진하는 진동 현상과, 미니배치 추정의 높은 노이즈다. 수십 년의 연구가 이를 개선했다.

Polyak(1964)의 **모멘텀**(momentum)은 물리학의 관성에서 영감을 받았다. 공이 골짜기를 구르며 속도가 붙는 것처럼, 이전 갱신 방향의 기억을 유지하여 일관된 방향으로 가속하고 진동을 감쇠한다. v(t) = beta * v(t-1) + grad(L)에서 beta(보통 0.9)가 관성 계수다. beta = 0이면 기억 없이 순수 SGD가 되고, beta = 0.99면 과거 방향에 강하게 끌려간다.

Nesterov(1983)는 모멘텀에 "미리 보기"를 추가했다. 현재 위치가 아니라 모멘텀이 데려갈 예상 위치에서 그래디언트를 계산해 방향을 보정하는 것이다. 수렴 속도를 이론적으로 O(1/t)에서 O(1/t^2)로 개선했다.

**적응적 학습률** 계열은 각 파라미터마다 다른 학습률을 자동으로 조절한다. AdaGrad(Duchi et al., 2011)는 과거 그래디언트 제곱의 누적합으로 나누어, 자주 갱신되는 파라미터는 학습률을 줄이고 드물게 갱신되는 파라미터는 유지한다. 희소(sparse) 데이터에 효과적이나, 누적합이 단조 증가하여 학습률이 너무 빨리 0에 가까워지는 문제가 있다. RMSprop(Hinton, 강의 슬라이드 2012)은 이를 지수 이동 평균으로 대체해 해결했다. Adam(Kingma & Ba, 2015)은 모멘텀(1차 모멘트, 평균)과 RMSprop(2차 모멘트, 분산)을 결합하고 바이어스 보정까지 추가하여, 현재 딥러닝에서 가장 널리 쓰이는 옵티마이저가 되었다.

## SGD 노이즈의 역설: 결점이 장점으로

SGD의 그래디언트 노이즈는 원래 정확한 최적화를 방해하는 단점으로 여겨졌다. 그러나 과파라미터화(overparameterized) 시대에 재평가가 이루어졌다.

신경망의 손실 곡면에는 수많은 최솟값이 존재하는데, 이들의 형태가 다르다. 날카로운 최솟값(sharp minimum)은 파라미터가 조금만 변해도 손실이 급증하여 새로운 데이터에 취약하다. 편평한 최솟값(flat minimum)은 파라미터 변동에 둔감하여 일반화 성능이 좋다.

Smith & Le(2018)는 SGD 노이즈가 학습률/배치크기 비율에 의해 결정되는 "유효 온도"로 작용하며, 이 온도가 높을수록 날카로운 최솟값에서 탈출하여 편평한 최솟값으로 수렴하게 만든다고 보였다. Keskar et al.(2017)은 큰 배치(낮은 노이즈)가 날카로운 최솟값으로, 작은 배치(높은 노이즈)가 편평한 최솟값으로 수렴하는 경향을 실험적으로 확인했다. SGD의 "결점"이 사실상 암묵적 정규화(implicit regularization)로 기능하는 역설이다.

이 "유효 온도" 개념은 통계역학의 온도와 구조적으로 유사하지만, Smith & Le가 통계역학에서 직접 차용한 것이라기보다는 확률적 미분 방정식 분석에서 자연스럽게 등장한 양이다. 물리학적 비유는 사후적으로 부여된 측면이 강하다.

## 현대 AI 기법과의 연결

경사하강법은 현대 AI에서 가장 보편적인 학습 도구다. 다만 각 연결의 성격은 다르다.

**수학적 원리의 직접 적용:**

- **역전파 + SGD**: 다층 신경망의 모든 가중치를 동시에 최적화한다. Cauchy의 최급강하법 --> Robbins-Monro의 확률적 확장 --> 역전파를 통한 효율적 그래디언트 계산이라는 직접적 계보를 갖는다. 현대 트랜스포머(GPT, BERT 등)의 수십억~수조 파라미터 학습도 이 원리의 규모 확장이다.
- **Adam 옵티마이저**: 모멘텀과 적응적 학습률을 결합한 것으로, 경사하강법의 직접적 변형이다. 현재 대규모 언어 모델 학습의 사실상 표준이다.
- **자연어 처리의 미세 조정(fine-tuning)**: 사전 학습된 모델의 파라미터를 작은 학습률의 SGD/Adam으로 재조정하는 기법으로, 경사하강법의 학습률 조절이라는 핵심 원리를 직접 활용한다.

**동일한 직관을 공유하는 구조적 유사성:**

- **강화학습의 정책 경사법(Policy Gradient)**: REINFORCE(Williams, 1992)는 보상의 기댓값에 대한 그래디언트를 추정하여 정책을 갱신한다. 경사하강법의 수학적 틀을 차용하되, 손실 함수 대신 보상 함수를, 데이터 레이블 대신 환경 피드백을 사용한다. 같은 수학적 틀의 다른 맥락 적용이다.
- **진화 전략(Evolution Strategies)**: Salimans et al.(2017, OpenAI)은 파라미터에 노이즈를 주입하고 보상 차이로 그래디언트를 추정하는 방법을 제안했다. 역전파 없이도 경사하강법과 유사한 갱신이 가능함을 보여, 그래디언트 추정이라는 핵심 아이디어가 역전파에 종속되지 않음을 드러냈다.

## 한계와 약점

경사하강법은 현대 AI의 주력 엔진이지만, 본질적 한계가 뚜렷하다.

- **비볼록 손실 곡면**: 딥러닝의 손실 함수는 극도로 비볼록(non-convex)하다. 전역 최솟값 도달을 보장하는 이론은 없다. Choromanska et al.(2015)은 고차원에서 지역 최솟값보다 안장점(saddle point, 한 방향으로 극소이고 다른 방향으로 극대인 점)이 더 큰 문제라고 지적했다. 안장점에서 그래디언트가 0에 가까워져 학습이 정체된다.
- **학습률 민감성**: 학습률이 너무 크면 발산하고, 너무 작으면 수렴이 극도로 느리다. 적절한 값을 찾는 것 자체가 비자명한 문제로, warmup, cosine decay, cyclical learning rates 등 학습률 스케줄링이 별도 연구 분야를 형성했다.
- **곡률 무시**: 순수 경사하강법은 1차 정보(기울기)만 사용하고 2차 정보(곡률, 즉 기울기의 변화율)를 무시한다. 뉴턴법(Newton's method)은 곡률을 사용해 수렴이 빠르지만, 헤시안(Hessian) 행렬 계산이 O(n^2) 메모리와 O(n^3) 연산을 요구하여 대규모 모델에 비실용적이다.
- **그래디언트 소실/폭발**: 깊은 네트워크에서 역전파 시 그래디언트가 층마다 곱해지면서 기하급수적으로 작아지거나 커진다. ResNet의 잔차 연결(He et al., 2015)과 그래디언트 클리핑 등이 완화하지만 근본 해결은 아니다.

## 용어 정리

그래디언트(gradient) - 다변수 함수의 각 변수에 대한 편미분을 모은 벡터. 함수가 가장 가파르게 증가하는 방향과 크기를 나타냄

학습률(learning rate) - 각 갱신 스텝에서 그래디언트 방향으로 얼마나 이동할지 결정하는 양의 스칼라 값. 딥러닝에서 가장 중요한 하이퍼파라미터 중 하나

확률적 근사(stochastic approximation) - 정확한 값 대신 확률적 추정치를 사용하여 반복적으로 해를 구하는 방법론. Robbins & Monro(1951)가 정립

미니배치(mini-batch) - 전체 데이터의 부분집합으로, SGD에서 그래디언트 추정에 사용하는 샘플 묶음. 보통 32~512개

모멘텀(momentum) - 이전 갱신 방향의 가중 평균을 유지하여 일관된 방향으로 가속하고 진동을 감쇠하는 기법

안장점(saddle point) - 한 방향으로는 극소이고 다른 방향으로는 극대인 점. 고차원 비볼록 함수에서 지역 최솟값보다 더 빈번히 발생

과파라미터화(overparameterization) - 모델의 파라미터 수가 학습 데이터 수보다 훨씬 많은 상태. 현대 딥러닝의 일반적 특징

암묵적 정규화(implicit regularization) - 명시적 정규화 항 없이도 SGD의 노이즈가 편평한 최솟값을 선호하게 만들어 일반화 성능을 높이는 효과

역전파(backpropagation) - 연쇄 법칙으로 다층 신경망의 모든 가중치에 대한 손실의 그래디언트를 출력층에서 입력층으로 역방향 전파하며 계산하는 알고리즘

비볼록 함수(non-convex function) - 지역 최솟값이 여러 개 존재할 수 있는 함수. 딥러닝 손실 함수의 일반적 특성으로, 전역 최솟값 도달이 보장되지 않음

---EN---
Gradient Descent and Stochastic Gradient Descent - The fundamental optimization algorithm that iteratively follows the slope of a function to find its minimum

## The Mathematical Principle of Steepest Descent

The mathematical root of gradient descent is Cauchy's (1847) method of steepest descent. While studying iterative approximation of solutions to systems of equations in astronomical orbit calculations, Cauchy exploited one fact: in a multivariable function, the gradient points in the direction of steepest increase. Therefore, moving in the **opposite direction of the gradient** decreases the function value most rapidly.

To visualize this spatially: imagine you must find the lowest valley on a foggy mountain, but you have no map -- only the ability to feel the slope beneath your feet. The most rational strategy is to step in the direction of steepest downhill slope, feel the slope again, and step again. This intuition, formalized mathematically, is gradient descent.

There is one update rule:

theta(t+1) = theta(t) - eta * grad(L(theta(t)))

Here theta is the parameter to optimize, eta is the learning rate, and grad(L) is the gradient of the loss function L (a vector collecting partial derivatives with respect to each parameter). If eta = 0.01 and the slope is +2, the parameter moves by 0.02 in the -2 direction. This single formula forms the backbone of all modern deep learning training.

## From Mathematics to AI: Three Leaps

Three decisive transitions brought this principle from pure mathematics to AI's core engine.

**First leap -- stochastic approximation.** Cauchy's original method computes the exact gradient over all data (batch gradient descent). But what if there are millions of data points? Scanning everything at each step is impractical. Robbins & Monro (1951) opened the breakthrough. Their stochastic approximation theory proved that convergence is achievable even with noisy estimates computed from randomly selected small subsets instead of the full gradient. This is stochastic gradient descent (SGD).

**Second leap -- backpropagation.** Even with gradient descent, it is useless without a way to compute the gradient for each of tens of thousands of weights in a multi-layer neural network. Rumelhart, Hinton & Williams (1986) demonstrated that the chain rule can propagate the output error backward to the input layer, efficiently computing all weight gradients in one pass. The mathematical idea itself was preceded by Linnainmaa's (1970) automatic differentiation and Werbos' (1974) neural network application, but the 1986 paper convincingly showed practical learning capability, creating a turning point for the field.

**Third leap -- scaling up.** The combination of mini-batch SGD and GPU parallel computation (2010s) made training models with billions of parameters possible.

The key correspondences are:

- Mathematical function minimization --> **neural network loss minimization** (learning objective)
- Gradient (slope vector) --> **update direction for each weight** (computed via backpropagation)
- Step size --> **learning rate eta** (how far to move per step)
- Iterative convergence --> **epoch-based training loop** (multiple passes through the full dataset)
- Robbins-Monro stochastic estimation --> **mini-batch gradient** (estimation from 32-512 samples)

## Anatomy of One Step: How SGD Works

Breaking down each iteration of SGD step by step:

1. Randomly sample a mini-batch (typically 32-512 samples) from the training data
2. Compute the model's predictions on the mini-batch (forward pass)
3. Measure the difference between predictions and targets using the loss function L
4. Compute grad(L) for all parameters via backpropagation
5. Apply the update rule: theta(t+1) = theta(t) - eta * grad_batch(L)
6. Repeat steps 1-5 for all mini-batches (one epoch = one full pass through the data)

The grad_batch from step 3 is an estimate of the true gradient. The crucial property is E[grad_batch] = grad(L) -- the expected value of the mini-batch estimate equals the true gradient (unbiasedness). Larger batch sizes reduce estimation variance for stability but increase computational cost. Smaller batch sizes introduce more noise but make each step faster and help escape local minima. This tradeoff determines mini-batch size.

## Learning Rate: The Most Important Hyperparameter

The learning rate eta is the single scalar that governs gradient descent's behavior. Its effect is extreme.

- **eta too large**: The algorithm overshoots the minimum and flies to the other side. Worse still, loss can increase each step -- divergence. Optimizing a quadratic function with eta = 1.0 shows oscillation around the minimum, drifting further away.
- **eta too small**: Convergence becomes extremely slow. With eta = 0.0001, the direction is correct but arrival within practical time is impossible.
- **Appropriate eta**: The standard strategy is to start large for rapid movement to good regions, then gradually reduce for precise convergence.

The convergence conditions Robbins & Monro (1951) proved require two properties: sum(eta_t) = infinity (able to travel far enough) and sum(eta_t^2) < infinity (noise eventually vanishes). In practice, empirical schedules like cosine annealing and warmup-decay replace these theoretical conditions, but the core intuition -- broad early, narrow late -- remains the same.

## Momentum and Adaptive Methods: Overcoming Pure SGD's Weaknesses

Pure SGD has two structural weaknesses: oscillation in narrow valley landscapes where the algorithm bounces between walls while advancing slowly, and high noise from mini-batch estimation. Decades of research have addressed these.

Polyak's (1964) **momentum** was inspired by physical inertia. Like a ball rolling downhill gaining speed, it maintains memory of previous update directions, accelerating in consistent directions and dampening oscillations. In v(t) = beta * v(t-1) + grad(L), beta (typically 0.9) is the inertia coefficient. With beta = 0, there is no memory and it reduces to pure SGD; with beta = 0.99, it is strongly pulled toward past directions.

Nesterov (1983) added a "look-ahead" to momentum -- computing the gradient at the anticipated position rather than the current one, correcting the direction. This theoretically improves convergence from O(1/t) to O(1/t^2).

**Adaptive learning rate** methods automatically adjust different learning rates for each parameter. AdaGrad (Duchi et al., 2011) divides by the accumulated sum of squared past gradients, reducing rates for frequently updated parameters while maintaining rates for rarely updated ones. Effective for sparse data, but the monotonically increasing accumulator causes learning rates to approach zero too quickly. RMSprop (Hinton, lecture slides 2012) replaced this with an exponential moving average. Adam (Kingma & Ba, 2015) combined momentum (first moment, mean) and RMSprop (second moment, variance) with bias correction, becoming the most widely used optimizer in deep learning today.

## The SGD Noise Paradox: Defect Becomes Advantage

SGD's gradient noise was originally considered a drawback that hinders accurate optimization. However, it has been reevaluated in the overparameterized era.

A neural network's loss surface contains numerous minima of different shapes. Sharp minima see loss spike with tiny parameter changes, making them vulnerable to new data. Flat minima are insensitive to parameter perturbation, yielding better generalization.

Smith & Le (2018) showed that SGD noise acts as an "effective temperature" determined by the learning rate/batch size ratio, and higher temperature causes escape from sharp minima toward flat ones. Keskar et al. (2017) experimentally confirmed that large batches (low noise) converge to sharp minima while small batches (high noise) converge to flat minima. SGD's "defect" paradoxically functions as implicit regularization.

This "effective temperature" concept is structurally analogous to temperature in statistical mechanics, but it emerged naturally from stochastic differential equation analysis rather than being directly borrowed from physics. The physical analogy was largely assigned after the fact.

## Connections to Modern AI

Gradient descent is modern AI's most universal learning tool. However, the nature of each connection differs.

**Direct application of the mathematical principle:**

- **Backpropagation + SGD**: Simultaneously optimizes all weights in multi-layer neural networks. It has a direct lineage: Cauchy's steepest descent --> Robbins-Monro's stochastic extension --> efficient gradient computation via backpropagation. Training modern transformers (GPT, BERT, etc.) with billions to trillions of parameters is a scaling of this same principle.
- **Adam optimizer**: Combining momentum and adaptive learning rates, this is a direct variant of gradient descent. It is currently the de facto standard for large language model training.
- **Fine-tuning in NLP**: Adjusting pretrained model parameters with small-learning-rate SGD/Adam directly leverages gradient descent's core principle of learning rate control.

**Structural similarities sharing the same intuition:**

- **Policy Gradient in reinforcement learning**: REINFORCE (Williams, 1992) estimates the gradient of expected reward to update the policy. It borrows gradient descent's mathematical framework but uses a reward function instead of a loss function, and environmental feedback instead of data labels -- the same framework applied in a different context.
- **Evolution Strategies**: Salimans et al. (2017, OpenAI) proposed estimating gradients by injecting parameter noise and using reward differences. This showed that gradient-descent-like updates are possible without backpropagation, revealing that the core idea of gradient estimation is not bound to backpropagation.

## Limitations and Weaknesses

Gradient descent is modern AI's primary engine, but has clear inherent limitations.

- **Non-convex loss surfaces**: Deep learning loss functions are extremely non-convex. No theory guarantees reaching the global minimum. Choromanska et al. (2015) argued that saddle points -- where gradients approach zero -- are a bigger problem than local minima in high dimensions, causing training to stagnate.
- **Learning rate sensitivity**: Too large an eta causes divergence; too small causes extremely slow convergence. Finding appropriate values is itself a non-trivial problem, and learning rate scheduling (warmup, cosine decay, cyclical learning rates) has formed a separate research area.
- **Ignoring curvature**: Pure gradient descent uses only first-order information (slope) and ignores second-order information (curvature -- the rate of change of the slope). Newton's method uses curvature for faster convergence, but Hessian matrix computation requires O(n^2) memory and O(n^3) operations, making it impractical for large models.
- **Vanishing/exploding gradients**: During backpropagation in deep networks, gradients multiply layer by layer and shrink or grow exponentially. ResNet's skip connections (He et al., 2015) and gradient clipping mitigate but do not fundamentally solve this problem.

## Glossary

Gradient - a vector collecting the partial derivatives of a multivariable function with respect to each variable, indicating the direction and magnitude of steepest increase

Learning rate - a positive scalar determining how far to move in the gradient direction at each update step; one of the most important hyperparameters in deep learning

Stochastic approximation - a methodology for iteratively finding solutions using probabilistic estimates instead of exact values; formalized by Robbins & Monro (1951)

Mini-batch - a subset of the full dataset used for gradient estimation in SGD, typically 32-512 samples

Momentum - a technique that maintains a weighted average of previous update directions to accelerate in consistent directions and dampen oscillations

Saddle point - a point that is a minimum in one direction and a maximum in another; more frequent than local minima in high-dimensional non-convex functions

Overparameterization - the state where the number of model parameters far exceeds the number of training data points; a general characteristic of modern deep learning

Implicit regularization - the effect by which SGD noise causes preference for flat minima, improving generalization without explicit regularization terms

Backpropagation - an algorithm that propagates loss gradients backward from the output layer to the input layer via the chain rule, efficiently computing gradients for all weights in a multi-layer neural network

Non-convex function - a function that may have multiple local minima; the general characteristic of deep learning loss functions, where reaching the global minimum is not guaranteed
